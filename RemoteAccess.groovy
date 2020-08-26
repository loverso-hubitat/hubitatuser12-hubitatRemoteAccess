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
 *
 *
 * Version 0.6
 *
 * 26/8/2020 - 0.6: add check for oauth
 * 26/8/2020 - 0.5: Fix root link
 * 26/8/2020 - 0.4: Move css and js to github, add import url link, update preferences
 * 26/8/2020 - 0.3: Fix links on main page menu
 */
definition(
	name: "Remote Access",
	namespace: "hubitatuser12",
	author: "Hubitat User 12",
	description: "Remote Access App",
	category: "General",
	iconUrl:   "",
	iconX2Url: "",
	iconX3Url: "",
    importUrl: "https://raw.githubusercontent.com/hubitatuser12/hubitatRemoteAccess/master/RemoteAccess.groovy"
)

preferences {
    section() {
        paragraph "Allowing remote access could compromise your system. Keep the link secure. Use at your own risk"
        if(app.getInstallationState() == "INCOMPLETE"){
            paragraph "Click \"Done\" and reload."
         } else {
            if(!state.accessToken) {
                paragraph "OAuth is not enabled. Remove this app from \"Apps\", enable OAuth for \"Remote Access\" in Apps Code, and re-add the user app."
            } else {
                paragraph "${buildRedirectURL()}/root"
                paragraph "<a href=\"${buildRedirectURL()}/root\" target=\"_blank\">Open remote access</a>"
            }
        }
    }
}

mappings {
    path("/root") { action: [GET: "rootGet"] }
    path("/css/:file") { action: [GET: "cssGet"] }
    path("/css/:subdir/:file") { action: [GET: "cssGet"] }
    path("/js/:file") { action: [GET: "jsGet"] }
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
    def sixthRoute = params.remove("sixthRoute")
    def fifthRoute = params.remove("fifthRoute")
    def fourthRoute = params.remove("fourthRoute")
    def thirdRoute = params.remove("thirdRoute")
    def secondRoute = params.remove("secondRoute")
    def firstRoute = params.remove("firstRoute")

    if(sixthRoute) {
        return loadContent("/${firstRoute}/${secondRoute}/${thirdRoute}/${fourthRoute}/${fifthRoute}/${sixthRoute}", request, params)
    } else if(fifthRoute) {
        return loadContent("/${firstRoute}/${secondRoute}/${thirdRoute}/${fourthRoute}/${fifthRoute}", request, params)
    } else if(fourthRoute) {
        return loadContent("/${firstRoute}/${secondRoute}/${thirdRoute}/${fourthRoute}", request, params)
    } else if(thirdRoute) {
        return loadContent("/${firstRoute}/${secondRoute}/${thirdRoute}", request, params)
    } else if(secondRoute) {
        return loadContent("/${firstRoute}/${secondRoute}", request, params)
    } else {
        return loadContent("/${firstRoute}", request, params)
    }
}

Map genericURLHandlerPost() {
    def sixthRoute = params.remove("sixthRoute")
    def fifthRoute = params.remove("fifthRoute")
    def fourthRoute = params.remove("fourthRoute")
    def thirdRoute = params.remove("thirdRoute")
    def secondRoute = params.remove("secondRoute")
    def firstRoute = params.remove("firstRoute")

    def url
    if(sixthRoute) {
        url = "/${firstRoute}/${secondRoute}/${thirdRoute}/${fourthRoute}/${fifthRoute}/${sixthRoute}"
    } else if(fifthRoute) {
        url = "/${firstRoute}/${secondRoute}/${thirdRoute}/${fourthRoute}/${fifthRoute}"
    } else if(fourthRoute) {
        url = "/${firstRoute}/${secondRoute}/${thirdRoute}/${fourthRoute}"
    } else if(thirdRoute) {
        url = "/${firstRoute}/${secondRoute}/${thirdRoute}"
    } else if(secondRoute) {
        url = "/${firstRoute}/${secondRoute}"
    } else {
        url = "/${firstRoute}"
    }
    
    def httpPostParams = [uri: "http://localhost:8080/${url}", headers: populateHeaders(request.headers), body: request.body, textParser:true]
    if(params) httpPostParams.query = params
    
    int statusCode = 200
    def body
    def respHeaders = [:]
    def contentType

    customHttpPost(httpPostParams, { response ->
        statusCode = response.status
        contentType = response.contentType

        // extra code for our customHttpGet, can be removed once hubitat fixes httpGet
        if(response instanceof Map) {
            response.headers.each { header ->
                respHeaders.put(header.key, header.value) 
            }
        } else {
            response.headers.each { header ->
                respHeaders.put(header.name, header.value) 
            }
        }
        
        if(response.data instanceof java.io.ByteArrayInputStream) {
            // to do: store in github and redirect
            body = replaceLocations(new String(response.data.bytes, "UTF-8"))
        } else if (response.data instanceof String) {
            body = replaceLocations(response.data)
        } else if (response.data != null) {
            body = replaceLocations(response.data.text)
        }
        
    })

    // handle redirects
    if(statusCode == 302) {
        respHeaders = handleRedirects(respHeaders)
    }
    return render([contentType:contentType, headers:respHeaders, status:statusCode, data:body])
}

Map handleRedirects(respHeaders) {
    if(respHeaders.get("Location").startsWith("http://localhost:8080")) {
        respHeaders.put("Location", replaceLocations(respHeaders.get("Location").substring("http://localhost:8080".size())))
    } else if(respHeaders.get("Location").startsWith("https://localhost:8080")) {
        respHeaders.put("Location", replaceLocations(respHeaders.get("Location").substring("https://localhost:8080".size())))
    } else {
        log.error "Unknown Location redirect: ${respHeaders.get('Location')}"
    }
    if(respHeaders.get("Location") == "/") {
        respHeaders.put("Location", replaceLocation("/", "/", "/root"))
    }

    return respHeaders
}


def loadContent(String requestUrl, request, params=null) {
    def statusCode = 200
    def body
    def respHeaders = [:]
    def contentType
    
    def httpGetParams = [uri: "http://localhost:8080${requestUrl}", headers: populateHeaders(request.headers), textParser:true]
    if(params) httpGetParams.query = params

    customHttpGet(httpGetParams, { response ->
        statusCode = response.status
        contentType = response.contentType

        if(response.data instanceof java.io.ByteArrayInputStream) {
            // TODO: store in github and redirect
            body = replaceLocations(new String(response.data.bytes, "UTF-8"))
        } else if (response.data instanceof String) {
            body = replaceLocations(response.data)
        } else if (response.data != null) {
            body = replaceLocations(response.data.text)
        }

        // extra code for our customHttpGet, can be removed once hubitat fixes httpGet
        if(response instanceof Map) {
            response.headers.each { header ->
                respHeaders.put(header.key, header.value) 
            }
        } else {
            response.headers.each { header ->
                respHeaders.put(header.name, header.value) 
            }
        }
    })

    // handle redirects
    if(statusCode == 302) {
        respHeaders = handleRedirects(respHeaders)
    }

    return render([contentType:contentType, headers:respHeaders, status:statusCode, data:body])
}

Map populateHeaders(headers) {
    def reqheaders = [:]
    
    headers.each { header ->
        if(header.key == "Cookie") {
            def cookieValue = (header.value instanceof String) ? header.value.split(";") : header.value[0].split(";")
            cookieValue.each { subcookie ->
                if(subcookie.startsWith("HUBSESSION")) {
                    reqheaders.put("Cookie", subcookie)
                }
            }
        } else if (header.key == "Accept") {
            if(header.value instanceof java.util.LinkedList) {
                header.value[0] = header.value[0].replaceAll("; q=0.01", "")
            }
            reqheaders.put(header.key, header.value)
        } else if (header.key == "Accept-encoding") {
            // do not add
        } else if (header.key == "Connection") {
            // do not add
        } else {
            reqheaders.put(header.key, header.value)
        }
    }
    
    return reqheaders
}


def jsGet() {
    // redirect
    return render([status:302, headers:[Location:"${getGitHackStaticFileLocation()}/js/${params.file}"]])
}

def cssGet() {
    if(params.subdir == "fonts") {
        return render([status:302, headers:[Location:"${getStaticFileLocation()}/css/fonts/${params.file}"]])
    }

    // redirect
    return render([status:302, headers:[Location:"${getGitHackStaticFileLocation()}/css/material.min.css"]])
}

def rootGet() {
    return loadContent("/", request)
}

def replaceLocations(String body) {
    body = body.replaceAll("/ui2/css/fonts/", "${getStaticFileLocation()}/css/fonts/")
    body = body.replaceAll("/ui2/images/", "${getStaticFileLocation()}/images/")
    body = body.replaceAll("/ui2/css/", "${getGitHackStaticFileLocation()}/css/")
    body = body.replaceAll("/ui2/js/", "${getGitHackStaticFileLocation()}/js/")

    //body = replaceLocation(body, "/ui2/js/")
    body = replaceLocation(body, "/hub/")
    body = replaceLocation(body, "/location/")
    body = replaceLocation(body, "/device/")
    body = replaceLocation(body, "/driver/")
    body = replaceLocation(body, "/app/")
    body = replaceLocation(body, "/installedapp/")
    body = replaceLocation(body, "/login")
    body = replaceLocation(body, "/events")
    
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


// The below methods can go away once Hubitat fixes their redirect handling (gives us the option to not follow redirects)

void customHttpPost(Map params, Closure closure) {
    customHttpMethod("POST", params, closure)
}


void customHttpGet(Map params, Closure closure) {
    customHttpMethod("GET", params, closure)
}

void customHttpMethod(String httpMethod, Map params, Closure closure) {
    def myURLString = params.uri
    if(params!= null) {
        myURLString = myURLString + buildParameters(params.query)
    }
    
    def myUrl = myURLString.toURL()

    def httpCon = myUrl.openConnection()
    httpCon.setFollowRedirects(false)
    httpCon.setInstanceFollowRedirects(false)
    
    httpCon.setRequestMethod(httpMethod);
    httpCon.setUseCaches(false);
    httpCon.setDoInput(true);
    
    params.headers.each { key, value ->
        if(value instanceof LinkedList) {
            httpCon.setRequestProperty(key, value.join(";"))
        } else {
            httpCon.setRequestProperty(key, value)
        }
    }
    
    if(httpMethod == "POST") {
        httpCon.setDoOutput(true);
	    def os = httpCon.getOutputStream();
	    os.write(params.body.bytes);
	    os.flush();
	    os.close();
    } else {
        httpCon.setDoOutput(false);
    }
    
    def response = [:]
    def respHeaders = [:]
    
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
    
    response.headers = respHeaders
    response.status = httpCon.getResponseCode()
    response.contentType = httpCon.getContentType()
    
    if(response.status != 302 && response.contentType != null) {   
       response.data = httpCon.content.text
    }
    
    closure(response)
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
