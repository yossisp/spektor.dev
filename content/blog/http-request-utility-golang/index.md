---
title: "How To Write an HTTP Request Utility in Go"
date: 2020-10-10T15:31:03.284Z
description: "How To Write an HTTP Request Utility in Go"
---

I recently started a project in Go language which is really fun. In my project I frequently make requests to an external API so I wrote I handy request utility which uses recursion to make retries. One of the main reasons for writing such a utility it that if authentication is required to an API you use then you want to write authentication logic once. This way if it's Oauth for example and your access token has expired the utility will always take care of getting a new access token (using the refresh token). In addition the utility can set headers common to all requests like `Content-Type` for example or perform any other logic common to all requests like logging. I will explain some of the gotchas I ran into while writing the code after the code snippet:

```go
package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

const (
	timeout = 30
)

// Provider holds state relevant to an external API
type Provider struct {
	maxRetries    int
	actualRetries int
	client        *http.Client
}

func (provider *Provider) request(req *http.Request) (response *http.Response, err error) {
	clonedReq := req.Clone(req.Context())
	if req.Body != nil {
		clonedReq.Body, err = req.GetBody()
		if err != nil {
			log.Println(err)
			return nil, err
		}
	}

	defer func() {
		if clonedReq.Body != nil {
			clonedReq.Body.Close()
		}
	}()

	// set headers common to all requests
	req.Header.Set("Content-Type", "application/json")
	response, err = provider.client.Do(req)
	if err != nil {
		log.Println("request: ", err)
		return nil, err
	}

	if provider.maxRetries == provider.actualRetries {
		err = fmt.Errorf("request: too many retries in request for request: %v", req)
		response.Body.Close()
		return nil, err
	}

	if response.StatusCode == http.StatusUnauthorized && provider.maxRetries > provider.actualRetries {
		bodyBytes, err := ioutil.ReadAll(response.Body)
		if err != nil {
			log.Println(err)
		} else {
			log.Println(string(bodyBytes))
		}
		provider.actualRetries++
		// ask for a new refresh token
		response.Body.Close()
		response, err = provider.request(clonedReq)
  }

  return response, err
}

func (provider *Provider) callExternalAPI() {
	req, err := http.NewRequest(http.MethodGet, "https://cat-fact.herokuapp.com/facts/random?animal_type=cat&amount=2", nil)
	if err != nil {
		return
	}
	response, err := provider.request(req)
	if err != nil {
		log.Println("callExternalAPI: ", err)
		return
	}
	defer response.Body.Close()
	// do something with the response
	catFact, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Println(err)
	} else {
		log.Println(string(catFact))
	}
}

func main() {
	provider := Provider{
		maxRetries:    5,
		actualRetries: 0,
		client: &http.Client{
			Timeout: time.Duration(timeout * time.Second),
		},
	}
	provider.callExternalAPI()
}
```

The general idea of `request` is that if 401 http status error is received (Unauthorized) another recursive call of `request` is made until the max amount of retries is reached or the call is successful in terms of the http status.

### Gotchas

1. Setting timeout is in `http.Client` is important, otherwise the connection may [hang indefinitely](https://medium.com/@nate510/don-t-use-go-s-default-http-client-4804cb19f779).
2. The client is created once per provider because it's safe for concurrent use and this is actually encouraged in the official [docs](https://golang.org/pkg/net/http/#Client).
3. Request body (if present) should be cloned. This is because the request body is closed automatically on the first request. Therefore if the request contains a body a copy should be made so that the request can be still used on future retries. The cloned request should be closed in the case it wasn't used.
4. `defer response.Body.Close()` can't be used in the code because the caller of `request` needs it in order to get the necessary information, therefore it should close it. However, if retries are made the body of previous responses should definitely be closed manually.
