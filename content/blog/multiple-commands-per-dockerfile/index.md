---
title: "How To Execute Multiple Commands Per Dockerfile"
date: 2021-04-04T15:31:03.284Z
description: "How To Execute Multiple Commands Per Dockerfile, How To Efficiently Dockerize .NET App"
---

<div style="display:flex;justify-content:center;padding-right:10%;padding-bottom:50px;padding-top:30px;">
    <img src="docker.svg"
            alt="Docker Logo"
            style="margin:0;"
            />
</div>

I dabbled into .NET recently and after finishing the project I ended up with 2 microservices which were .NET projects under the same [solution](https://docs.microsoft.com/en-us/visualstudio/ide/solutions-and-projects-in-visual-studio?view=vs-2019). It turns out that when dockerizing the microservices their build instructions are identical. The only difference is the command which needs to be invoked in order to start the microservice.

Below you can see a sample Dockerfile for a .NET application with multiple microservices:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:5.0 AS build
WORKDIR /app

# install necessary packages
COPY *.sln .
COPY MicroserviceA/*.csproj ./MicroserviceA/
COPY MicroserviceB/*.csproj ./MicroserviceB/
COPY Common/*.csproj ./Common/
RUN dotnet restore ./MySolution.sln

# build executables of all projects/microservices
COPY . ./
RUN dotnet publish -c Release -o out

# Copy executables
FROM mcr.microsoft.com/dotnet/aspnet:5.0
WORKDIR /app
COPY --from=build /app/out .
CMD ["dotnet", "MicroserviceA.dll"]
```

As you can see the `CMD` directive invokes `MicroserviceA`, but what about `MicroserviceB`? Because all previous stages are the same for `MicroserviceB` it's redundant to have another Dockerfile dedicated just to `MicroserviceB`.

Luckily, the `CMD` specified in the Dockerfile is only a default. This means that it can be [overridden](https://docs.docker.com/engine/reference/run/#cmd-default-command-or-options). Same logic goes for `ENTRYPOINT` [directive](https://docs.docker.com/engine/reference/run/#entrypoint-default-command-to-execute-at-runtime).

This means that executing `docker run myimage` on the image built by the Dockerfile above will start `MicroserviceA` by default. However, executing `docker run myimage dotnet MicroserviceB.dll` will override the default `CMD` and invoke `MicroserviceB` instead. As a result the Dockerfile can be re-used for any microservice project in the .NET app.

An even cleaner solution is to use `docker-compose` `command` option in order to specify each microservice:

```
version: "3.9"
services:
  microservicea:
    image: myimage/microservicea
    build: .
    command: ["dotnet", "MicroserviceA.dll"]
  microserviceb:
    image: myimage/microserviceb
    build: .
    command: ["dotnet", "MicroserviceB.dll"]
```

I hope the post shed some light on overriding Dockerfile default `CMD` and on organizing your .NET apps!
