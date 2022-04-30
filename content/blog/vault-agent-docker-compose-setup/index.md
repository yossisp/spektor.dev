---
title: "Vault Agent Docker Compose Setup"
date: 2022-05-01T19:19:03.284Z
description: "Vault Agent Docker Compose Setup"
tags: "vault, docker"
---

![vault](./vault.jpg)

Recently I needed to integrate [Hashicorp Vault](https://www.hashicorp.com/products/vault) with a Java application. For local development I wanted to use [Vault Agent](https://www.vaultproject.io/docs/agent) which can connect to the Vault server. The advantage of using Vault Agent is that it bears the brunt of authentication complexity with Vault server (including SSL certificates). Effectively, this means that a client application can send HTTP requests to Vault Agent without any need to authenticate. This setup is frequently used in the real world for example by using [Agent Sidecar Injector](https://www.vaultproject.io/docs/platform/k8s/injector) inside a Kubernetes cluster. It makes it easy for client applications inside a K8s pod to get/put information to a Vault server without each one having to perform the tedious authentication process.

Surprisingly, I couldn't find much information on using Vault with Vault Agent via docker-compose, which in my opinion is by far the easiest method to set up a Vault playground. I did find [this](https://gitlab.com/kawsark/vault-agent-docker/-/tree/master) example which involved a more complex setup as well as using Postgres and Nginx. I'd like to present the most minimal setup, the bare basics needed to spin up a Vault Agent and access it locally via `localhost`.

**WARNING:** the setup is intentionally simplified, please don't use it in production.

First of all we'll use the official Vault docker images for the `docker-compose.yml`:
```yml
version: '3.7'

services:
  vault-agent:
    image: hashicorp/vault:1.9.6
    restart: always
    ports:
      - "8100:8200"
    volumes:
      - ./helpers:/helpers
    environment:
      VAULT_ADDR: "http://vault:8200"
    container_name: vault-agent
    entrypoint: "vault agent -log-level debug -config=/helpers/vault-agent.hcl"
  vault:
    image: hashicorp/vault:1.9.6
    restart: always
    volumes:
      - ./helpers:/helpers
      - /vault/data
      - /etc/vault/logs
    ports:
      - "8200:8200/tcp"
    environment:
      VAULT_ADDR: http://localhost:8200
      VAULT_TOKEN: root
      VAULT_DEV_ROOT_TOKEN_ID: root
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
    cap_add:
      - IPC_LOCK
    container_name: vault
    entrypoint: "vault server -dev"
```

Here we're using the same image to start Vault server in dev mode as well as start the Vault Agent. In addition a volume is created for `helpers` directory which will contain:
1. The policy for Vault server `admin-policy.hcl`:
```hcl
path "sys/health"
{
  capabilities = ["read", "sudo"]
}
path "sys/policies/acl"
{
  capabilities = ["list"]
}
path "sys/policies/acl/*"
{
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
path "auth/*"
{
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
path "sys/auth/*"
{
  capabilities = ["create", "update", "delete", "sudo"]
}
path "sys/auth"
{
  capabilities = ["read"]
}
path "kv/*"
{
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
path "secret/*"
{
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
path "identity/entity-alias"
{
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
path "identity/entity-alias/*"
{
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
path "identity/entity"
{
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
path "identity/entity/*"
{
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
path "sys/mounts/*"
{
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
path "sys/mounts"
{
  capabilities = ["read"]
}
```
2. The policy for Vault Agent `vault-agent.hcl`:
```hcl
pid_file = "./pidfile"
vault {
  address = "http://vault:8200"
  retry {
    num_retries = 5
  }
}
auto_auth {
  method {
    type = "approle"
    config = {
      role_id_file_path = "/helpers/role_id"
      secret_id_file_path = "/helpers/secret_id"
      remove_secret_id_file_after_reading = false
    }
  }
  sink "file" {
    config = {
      path = "/helpers/sink_file"
    }
  }
}
cache {
  use_auto_auth_token = true
}
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = true
}
```
3. The `init.sh` script which will create AppRole auth method:
```shell
apk add jq
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=root
vault secrets enable -version=2 kv
vault auth enable approle
vault policy write admin-policy /helpers/admin-policy.hcl
vault write auth/approle/role/dev-role token_policies="admin-policy"
vault read -format=json auth/approle/role/dev-role/role-id \
  | jq -r '.data.role_id' > /helpers/role_id
vault write -format=json -f auth/approle/role/dev-role/secret-id \
  | jq -r '.data.secret_id' > /helpers/secret_id
```

After you created the above files in the `helpers` directory, the project structure should be as follows:
```
.
├── docker-compose.yml
└── helpers
    ├── admin-policy.hcl
    ├── init.sh
    └── vault-agent.hcl
```

Next run the following commands in terminal:

1. `docker-compose up`
2. `docker exec -it vault /bin/sh` - enter the Vault server container
3. `source /helpers/init.sh` - the script initiates version 2 kv engine in Vault, creates an AppRole policy and generates the role id and secret id for the role, saving them in the corresponding files.
4. `exit` - exit from the Vault server container
5. `docker restart vault-agent` - restart the Vault Agent container to pick up the newly created `role_id` and `secret_id`.

Now any client application can access Vault Agent over `http://localhost:8100` on the host machine (Vault server can be accessed at `http://localhost:8200`), for example the following command creates a secret name `hello`:
```shell
curl --request POST -H "Content-Type: application/json"  \
--data '{"data":{"foo":"bar"}}' http://localhost:8100/v1/secret/data/hello
```
while this command retrieves the secret name `hello`:
```shell
curl http://localhost:8100/v1/secret/data/hello
```