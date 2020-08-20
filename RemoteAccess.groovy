/**
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
definition(
	name: "Remote Access",
	namespace: "hubitatuser12",
	author: "Hubitat User 12",
	description: "Remote Access App",
	category: "General",
	iconUrl:   "",
	iconX2Url: "",
	iconX3Url: ""
)

preferences {
    section("Url") {
        paragraph "<a href='${buildRedirectURL()}/root' target='_blank'>Main Page</a>"
    }
}

mappings {
    path("/root") { action: [GET: "rootGet"] }
    path("/login") { action: [GET: "loginGet", POST: "loginPost"] }
    path("/css/:file") { action: [GET: "cssGet"] }
    path("/css/:subdir/:file") { action: [GET: "cssGet"] }
    path("/installedapp/update/json") { action: [POST: "installedAppUpdateJson"] }
    // this order is important for matching (Generic must be at the end)
    path("/:firstRoute") { action: [GET: "genericURLHandlerGet", POST: "genericURLHandlerPost"] }
    path("/:firstRoute/:secondRoute") { action: [GET: "genericURLHandlerGet", POST: "genericURLHandlerPost"] }
    path("/:firstRoute/:secondRoute/:thirdRoute") { action: [GET: "genericURLHandlerGet", POST: "genericURLHandlerPost"] }
    path("/:firstRoute/:secondRoute/:thirdRoute/:fourthRoute") { action: [GET: "genericURLHandlerGet", POST: "genericURLHandlerPost"] }
    path("/:firstRoute/:secondRoute/:thirdRoute/:fourthRoute/:fifthRoute") { action: [GET: "genericURLHandlerGet", POST: "genericURLHandlerPost"] }
    path("/:firstRoute/:secondRoute/:thirdRoute/:fourthRoute/:fifthRoute/:sixthRoute") { action: [GET: "genericURLHandlerGet", POST: "genericURLHandlerPost"] }
}

String buildRedirectURL() {
    return "${apiServerUrl}/${hubUID}/token/${state.accessToken}/apps/${app.id}"
}

String getStaticFileLocation() {
    // Direct URL (Will not return proper content-type)
    return "https://raw.githubusercontent.com/hubitatuser12/hubitatRemoteAccess/master"
}

String getGitHackStaticFileLocation() {
    // githack production (replace "tag" with correct tag)
    //return "https://rawcdn.githack.com/hubitatuser12/hubitatRemoteAccess/tag"

    // githack development
    return "https://raw.githack.com/hubitatuser12/hubitatRemoteAccess/master"
}

def genericURLHandlerGet() {
    if(params.sixthRoute) {
        return customHttpGet("/${params.firstRoute}/${params.secondRoute}/${params.thirdRoute}/${params.fourthRoute}/${params.fifthRoute}/${params.sixthRoute}", request)
    } else if(params.fifthRoute) {
        return customHttpGet("/${params.firstRoute}/${params.secondRoute}/${params.thirdRoute}/${params.fourthRoute}/${params.fifthRoute}", request)
    } else if(params.fourthRoute) {
        return customHttpGet("/${params.firstRoute}/${params.secondRoute}/${params.thirdRoute}/${params.fourthRoute}", request)
    } else if(params.thirdRoute) {
        return customHttpGet("/${params.firstRoute}/${params.secondRoute}/${params.thirdRoute}", request)
    } else if(params.secondRoute) {
        return customHttpGet("/${params.firstRoute}/${params.secondRoute}", request)
    } else {
        return customHttpGet("/${params.firstRoute}", request)
    }
}

Map genericURLHandlerPost() {
    int statusCode = 200
    def body
    def headers = [:]
    def contentType

    def url
    if(params.sixthRoute) {
        url = "/${params.firstRoute}/${params.secondRoute}/${params.thirdRoute}/${params.fourthRoute}/${params.fifthRoute}/${params.sixthRoute}"
    } else if(params.fifthRoute) {
        url = "/${params.firstRoute}/${params.secondRoute}/${params.thirdRoute}/${params.fourthRoute}/${params.fifthRoute}"
    } else if(params.fourthRoute) {
        url = "/${params.firstRoute}/${params.secondRoute}/${params.thirdRoute}/${params.fourthRoute}"
    } else if(params.thirdRoute) {
        url = "/${params.firstRoute}/${params.secondRoute}/${params.thirdRoute}"
    } else if(params.secondRoute) {
        url = "/${params.firstRoute}/${params.secondRoute}"
    } else {
        url = "/${params.firstRoute}"
    }

    def httpPostParams = [uri: "http://localhost:8080/${url}", body: request.body, textParser:true]
    
    httpPost(httpPostParams, { response ->
        response.headers.each { header ->
            headers.put(header.name, header.value)
        }
        body = response.data?.text
    })

    return render([contentType:contentType, headers:headers, status:statusCode, data:body])
}

def installedAppUpdateJson() {
    int statusCode = 200
    def body
    def headers = [:]
    def contentType

    def url = "/installedapp/update/json"
    def httpPostParams = [uri: "http://localhost:8080/${url}", body: request.body, textParser:true]
    
    httpPost(httpPostParams, { response ->
        response.headers.each { header ->
            headers.put(header.name, header.value)
        }
        body = response.data?.text
        if(body instanceof String) {
            Map jsonData = new groovy.json.JsonSlurper().parseText(body)
            if(jsonData.location == "/installedapp/list") {
                jsonData.location = "${buildRedirectURL()}/installedapp/list"
            }
            body = groovy.json.JsonOutput.toJson(jsonData)
        }
    })

    return render([contentType:contentType, headers:headers, status:statusCode, data:body])
}


def loginGet() {
    return loadContent("/login", request)
}

def loginPost() {
    def headers = [:]
    boolean loginRedirect = false
    def httpPostParams = [uri: "http://localhost:8080/login", body: request.body, textParser:true]
    httpPost(httpPostParams, { response ->
        response.headers.each { header ->
            headers.put(header.name, header.value)
        }
        String responseData = response.data?.text
        if(responseData?.contains("<title>Login</title>")) {
            // we did not login properly
            loginRedirect = true
        }
    })
    
    if(loginRedirect) {
        headers.Location = "${buildRedirectURL()}/login"
        return render([status:302, headers:headers])
    } else {
        headers.Location = "${buildRedirectURL()}/root"
        return render([status:302, headers:headers])
    }
}

def deviceRouteHandlerGet() {
    def queryParams = [:]
    params.each { param ->
        if(param.key != "secondRoute")
            queryParams.put(param.key, param.value)
    }
    return loadContent("/device/${params.secondRoute}", request, queryParams)
}

def deviceRouteHandlerPost() {
    def statusCode = 200
    def body
    def headers = [:]
    def contentType

    def httpPostParams = [uri: "http://localhost:8080/device/${secondRoute}", body: request.body, textParser:true]
    
    httpPost(httpPostParams, { response ->
        response.headers.each { header ->
            headers.put(header.name, header.value)
        }
        body = response.data?.text
    })

    return render([contentType:contentType, headers:headers, status:statusCode, data:body])
}

def customHttpGet(String requestUrl, request, params=null) {
    def statusCode = 200
    def body
    def headers = [:]
    def respHeaders = [:]
    def contentType
    
    request.headers.each { header ->
        if(header.key == "Cookie") {
            def cookieValue = (header.value instanceof String) ? header.value.split(";") : header.value[0].split(";")
            cookieValue.each { subcookie ->
                if(subcookie.startsWith("HUBSESSION")) {
                    headers.put("Cookie", subcookie)
                }
            }
        } else if (header.key == "Accept") {
            if(header.value instanceof java.util.LinkedList) {
                header.value[0] = header.value[0].replaceAll("; q=0.01", "")
                headers.put(header.key, header.value[0])
            }
        } else if (header.key == "Accept-encoding") {
            // do not add
        } else if (header.key == "Connection") {
            // do not add
        } else {
            headers.put(header.key, header.value)
        }
    }

    def myURLString = "http://localhost:8080${requestUrl}"
    if(params!= null) {
        myURLString = myURLString + buildParameters(params)
    }
    def myUrl = myURLString.toURL()

    def httpCon = myUrl.openConnection()
    httpCon.setFollowRedirects(false)
    httpCon.setInstanceFollowRedirects(false)
    
    httpCon.setRequestMethod("GET");
    httpCon.setUseCaches(false);
    httpCon.setDoInput(true);
    httpCon.setDoOutput(false);
    
    headers.each { key, value ->
        if(value instanceof LinkedList) {
            httpCon.setRequestProperty(key, value.join(";"))
        } else {
            httpCon.setRequestProperty(key, value)
        }
    }
    
    int headerField = 1
    String headerFieldValue = ""
    String headerFieldKey = ""
    while(headerFieldKey != null && headerField < 100) {
        headerFieldValue = httpCon.getHeaderField(headerField)
        headerFieldKey = httpCon.getHeaderFieldKey(headerField)
        if(headerFieldValue != null && headerFieldKey != null) {
            respHeaders.put(headerFieldKey, headerFieldValue)
        }
        headerField++
    }
    
    statusCode = httpCon.getResponseCode();
    
    if(statusCode != 302) {
        body = replaceLocations(httpCon.content.text)
        contentType = httpCon.getContentType();
    }

    if(statusCode == 302) {
        // replace Location Header
        String locationHeader = respHeaders.get("Location")
        locationHeader = locationHeader.replace("https://localhost:8080", buildRedirectURL())
        respHeaders.put("Location", locationHeader)
        return render([status:302, headers:respHeaders])
    } else {
        return render([contentType:contentType, headers:respHeaders, status:statusCode, data:body])
    }
}

def loadContent(String requestUrl, request, params=null) {
    def statusCode = 200
    def body
    def headers = [:]
    def contentType
    
    request.headers.each { header ->
        if(header.key == "Cookie") {
            def cookieValue = (header.value instanceof String) ? header.value.split(";") : header.value[0].split(";")
            cookieValue.each { subcookie ->
                if(subcookie.startsWith("HUBSESSION")) {
                    headers.put("Cookie", subcookie)
                }
            }
        } else if (header.key == "Accept") {
            if(header.value instanceof java.util.LinkedList) {
                header.value[0] = header.value[0].replaceAll("; q=0.01", "")
            }
        } else if (header.key == "Connection") {
            
        } else {
            headers.put(header.key, header.value)
        }
    }

    def httpGetParams = [uri: "http://localhost:8080${requestUrl}", headers: headers, textParser:true]
    if(params) httpGetParams.query = params
    def isLoginPrompt = false

    try {

        httpGet(httpGetParams, { response ->
                statusCode = response.status
                contentType = response.getContentType()

                if(response.data instanceof java.io.ByteArrayInputStream) {
                    // TODO: store in github and redirect
                    body = replaceLocations(new String(response.data.bytes, "UTF-8"))
                } else {
                    body = replaceLocations(response.data.text)
                }

                // If Hubitat fixes redirect following in httpGet we can do a better job of handling this!
                // check for login page
                if(body.contains("<title>Login</title>") && requestUrl != "/login") {
                    // we have a login page
                    isLoginPrompt = true
                }
                response.headers.each {   headers.put(it.name, it.value) }
                
        })
    } catch (Exception e) {
        log.warn "Exception in Get! ${e.message} ${httpGetParams}"
    }

    if(isLoginPrompt) {
        headers.Location = "${buildRedirectURL()}/login"
        return render([status:302, headers:headers])
    } else {
        return render([contentType:contentType, headers:headers, status:statusCode, data:body])
    }
}

String buildParameters(Map urlParameters) {
    StringBuilder query = new StringBuilder("?");
    
    urlParameters.eachWithIndex { entry, index ->
        if(index > 0) {
            query.append("&")
        }
        try {
            query.append(entry.key).append("=").append(URLEncoder.encode(entry.value, "UTF-8"))
        } catch (UnsupportedEncodingException ex) {
            log.warn "Problem with encoding"
        }
    }
    
    return query.toString()
}

def cssGet() {
    log.debug "In css get" + params
    if(params.file == "material.min.css") {
        log.debug "do a redirect for material.min"
        // redirect
        return render([status:302, headers:[Location:"${getGitHackStaticFileLocation()}/css/material.min.css"]])
    }

    if(params.subdir == "fonts") {
        return render([status:302, headers:[Location:"${getStaticFileLocation()}/css/fonts/${params.file}"]])
    }

    def requestUrl
    if(params.subdir) {
        requestUrl = "/ui2/css/${subdir}/${params.file}"
    } else {
        requestUrl = "/ui2/css/${params.file}"
    }
    
    def content = loadContent(requestUrl, request)
    
    if(content.data.contains("sort_")) {
        content.data = content.data.replaceAll("../images/sort_both.png", "${getStaticFileLocation()}/images/sort_both.png")
        content.data = content.data.replaceAll("../images/sort_asc.png", "${getStaticFileLocation()}/images/sort_asc.png")
        content.data = content.data.replaceAll("../images/sort_desc.png", "${getStaticFileLocation()}/images/sort_desc.png")
    }
    return content
}

def rootGet() {
    return loadContent("/", request)
}

def replaceLocations(String body) {
    body = body.replaceAll("/ui2/css/fonts/", "${getStaticFileLocation()}/css/fonts/")
    body = body.replaceAll("/ui2/images/", "${getStaticFileLocation()}/images/")
    body = body.replaceAll("/ui2/css/", "${buildRedirectURL()}/css/")

    body = replaceLocation(body, "/ui2/js/")
    body = replaceLocation(body, "/hub/messages")
    body = replaceLocation(body, "/device/")
    body = replaceLocation(body, "/installedapp/")
    
    return body
}

def replaceLocation(String body, String oldLocation, String newLocation)  {
    body = body.replaceAll("${oldLocation}", "${buildRedirectURL()}${newLocation}")
}

def replaceLocation(String body, String oldLocation)  {
    body = body.replaceAll("${oldLocation}", "${buildRedirectURL()}${oldLocation}")
}


void installed() {
    log.trace "installed"
    updated()
}

void updated() {
    log.trace "updated"
    try {
        if (!state.accessToken) {
            createAccessToken()
        }
    } catch (e) {
        log.error "Exception while trying to create access token"
    }
    
}

void uninstalled() {
    log.trace "uninstalled"
}



void customHttpPost(String requestURLString, String body) {
    // until Hubitat fixes redirect handling, we have to do this ourselves.
    def myUrl = requestURLString.toURL()
    def httpCon = myUrl.openConnection()
    
//HttpURLConnection httpCon = (HttpURLConnection) urlObj.openConnection();
 
    httpCon.setDoOutput(true);
    httpCon.setRequestMethod("POST");
 
    httpCon.getOutputStream() << body;
}

