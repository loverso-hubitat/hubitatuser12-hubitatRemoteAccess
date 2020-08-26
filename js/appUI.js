function jq(myid) {
    return "#" + myid.replace(/(:|\.|\[|\]|,|\(|\))/g, "\\$1");
}

var blockChangeSubmit = true
var nextElement
var refreshInterval
var debug = false

$(document).ready(function () {
    var url = new URL(window.location)
    debug = url.searchParams.get("debug")
    if (debug == "true") {
        log("Debug is Enabled")
    }
    updateSelect2()
});

$(document).on('click', '.hideable', function () {
    log("click event from a .hideable class element")
    var target = $(this).data("target");
    if ($(this).hasClass('collapsed')) {
        log("element has a collapsed class")
        $('#' + target).fadeIn();
        $(".selectpicker[multiple]").SumoSelect()
        $(this).removeClass('collapsed')
        //localStorage.setItem('collapsed|' + appId +"|"+ target, false)
    } else {
        log("element does not have a collapsed class")
        $('#' + target).fadeOut();
        $(this).addClass('collapsed')
        //localStorage.setItem('collapsed|' + appId +"|"+ target, true)
    }
})

$(document).on('blur', "input.submitOnChange[type=time]", function (e) {
    log("soc from time element")
    log("blur event from an input type of time with submitOnChange")
    e.preventDefault();
    e.stopPropagation();
    var time = $(this).val();
    var match = /^([0-2]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    if (match) {
        log("calling changeSubmit")
        changeSubmit(this);
    }
})

$(document).on('focus', '.submitOnChange', function (e) {
    log("focus event in a submitOnChange class")
    $(".mdl-layout__header-row .mdl-spinner").show()
    $('.buttons.form-actions').children().prop('disabled', true)
})

$(document).on('blur', '.submitOnChange', function (e) {
    log("blur event from submitOnChange class form-action buttons are enabled")
    $(".mdl-layout__header-row .mdl-spinner").hide()
    $('.buttons.form-actions').children().prop('disabled', false)
})

$(document).on('change', '.submitOnChange', function (e) {
    log("change event from a submitOnChange class")
    if ($(this).attr('type') != 'time' && !$(this).hasClass('selectpicker')) { // removed due to android bug?
        log(this.className)
        log("soc from any .submitOnChange")
        //var focused = $(this);
        //var inputs = $(this).closest('form').find(":input[type!='hidden']");
        //nextElement = inputs.eq(inputs.index(focused) + 1).focus();
        e.preventDefault()
        log("calling changeSubmit")
        changeSubmit(this);
    }
});

$(document).on('change', '.mdl-switch', function (e) {
    log("change event from mdl-switch class")
    var name = "[name='" + e.target.id + "']"
    $(name).val($(this).is('.is-checked'))
});

$(document).on('change', 'textarea.form-control', function (e) {
    log("change event from a textarea formcontrol class")
    if ($(this).attr('type') == 'textarea') {
        this.innerHTML = this.value
    }
});

$(document).on('change', ".checkall input", function () {
    log("change event from an input with checkall class")
    var listElements = $(this).parent().parent().siblings('.modal-body').find('.checkbox')
    for (var i = 0, n = listElements.length; i < n; i++) {
        var element = listElements[i];

        if ($(this).parent().hasClass('is-checked')) {
            log("checkbox checked")
            element.firstChild.MaterialCheckbox.check();
        } else {
            log("checkbox unchecked")
            element.firstChild.MaterialCheckbox.uncheck();
        }
    }
});

$(document).on('change', '.check', function () {
    log("change event from check class")
    var listElements = document.querySelectorAll('.check');
    for (var i = 0, n = listElements.length; i < n; i++) {
        var element = listElements[i];
        if (document.querySelector('#checkall')) {
            if ($('.check input:checked').length == $('.check input').length) {
                log("checkbox checked")
                document.querySelector('#checkall').MaterialCheckbox.check();
            } else {
                log("checkbox unchecked")
                document.querySelector('#checkall').MaterialCheckbox.uncheck();
            }
        }
    }
});

$(document).on('click', '.device-save', function (e) {
    if ($('.device-list').is(':visible')) {
        log("click event while device list is visible")
        e.preventDefault()
        log("a device-list was visible and it was visibile so will click its sibling button")
        $('.device-list:visible').siblings('button').click()
    }
})
$(document).on('click', function (e) {
    if ($('.device-list').is(':visible') && !$(e.target).closest('.device-list').is(':visible')) {
        log("click event while device list is visible")
        e.preventDefault()
        log("a device-list was visible and it was visibile so will click its sibling button")
        $('.device-list:visible').siblings('button').click()
    }
})

$(document).on('click', '.btn-device, .btn-device-required', function (event) {
    log("click event on a btn-device or btn-device-required class")
    var button = $(this) // Button that triggered the modal
    log(button);
    var capability = button.data('capability') // Extract info from data-* attributes
    var elemName = button.data('elemname')
    var multiple = button.data('multiple')
    var listType = "radio"
    if (multiple)
        listType = "checkbox"
    var dropdown = $(this).siblings('.device-list').first()
    if ($(dropdown).is(':hidden')) {
        log("dropdown is hidden")
        var mbody = $(dropdown).find('.modal-body')
        mbody.html("");
        //mbody.css("max-height",$(window).height() - 380).css("overflow-y","auto");
        //mbody.height($(window).height() - 380);
        //modal.width($(window).width() - 50);
        log(capability)
        log("getting list of devices from endpoint")
        $.getJSON('/device/listJson?capability=' + capability, function (data) {
            var items
            if (listType == "radio") {
                log("list type is radio (single select)")
                items = data.map(function (item) {
                    return '<div class="' + listType + '"><label class="device-select-label device-select-item mdl-radio mdl-js-radio" for="' + elemName + item.id + '"><input class="mdl-radio__button" type="' +
                        listType + '" name="' + elemName + '" value="' + item.id + '" id="' + elemName + item.id + '"><span class="mdl-radio__label">' + item.displayName +
                        '</span></label></div>';
                });
            } else {
                log("list type is not radio (multiple select)")
                items = data.map(function (item) {
                    return '<div class="' + listType + '"><label class="device-select-label device-select-item mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect check" for="' + elemName + item.id + '"><input class="mdl-checkbox__input" type="' +
                        listType + '" name="' + elemName + '" value="' + item.id + '" id="' + elemName + item.id + '"><span class="mdl-checkbox__label">' + item.displayName +
                        '</span></label></div>';
                });
            }

            if (items.length) {
                log("returned items (devices) has length")
                var content = items.join('');
                mbody.append(content);
                mbody.append('<input type="hidden" id="fieldToUpdate" value="' + elemName + '"/>')
                componentHandler.upgradeDom();
                var fieldToUpdateVal = $(jq('settings[' + elemName + ']')).val()
                log(fieldToUpdateVal)
                if (fieldToUpdateVal.length > 0) {
                    var devList = fieldToUpdateVal.split(',')
                    //$(modal).find('.device-select-item').val(devList)
                    $.each(devList, function (key, val) {
                        $('.device-select-item').find("input[value='" + val + "']").parent().addClass('is-checked')
                    })
                }
            }

            var cleanCapability = capability.replace("capability.", "").replace("device.", "").replace(/([A-Z]+)/g, " $1").replace(/^,/, " ");
            cleanCapability = cleanCapability.charAt(0).toUpperCase() + cleanCapability.slice(1);
            if (cleanCapability == "*") {
                if (multiple) {
                    $('.checkAllBoxes').show()
                    cleanCapability = "Device"
                } else {
                    $('.checkAllBoxes').hide()
                    cleanCapability = "Device(s)"
                }
            }

            $('.modal-body').css("height", $('#deviceDialog').height() - 180 + "px")
            dropdown.fadeIn()
            dropdown[0].scrollIntoView({behavior: "instant", block: "end", inline: "nearest"})
            event.preventDefault()
        })
    } else {
        log("dropdown is visible")
        var dropdown = $(this).siblings('.device-list').first()
        var mbody = $(dropdown).find('.modal-body')
        var devList = []
        var devListHtml = ''
        mbody.find('.device-select-item').each(function (index) {
            if ($(this).is('.is-checked')) {
                log("Found checked item")
                devList.push($(this).find('input').val())
                var label = $(dropdown).find("label[for='" + $(this).attr("name") + "']").text();
                //devListHtml += '<li class="list-group-item">' + $(this).parent('label').text() + '</li>'
                devListHtml += $(this).text() + '<br/>'
            }
        });
        devListHtml = devListHtml.replace(/,\s*$/, "");

        var fieldToUpdate = $(dropdown).find('#fieldToUpdate').attr('value')
        $(jq('settings[' + fieldToUpdate + ']')).val(devList);
        $(jq('settings[' + fieldToUpdate + ']')).trigger('change');
        //$(jq('settings['+fieldToUpdate+']')).change();

        if (devListHtml.length > 0) {
            $(document.getElementById(fieldToUpdate + 'devlist')).html(devListHtml)
            //$('#' + fieldToUpdate + 'devlist').parent().attr('data-empty', 'false')
            $(document.getElementById(fieldToUpdate + 'devlist')).parent().removeClass('device-btn-empty')
            $(document.getElementById(fieldToUpdate + 'devlist')).parent().addClass('device-btn-filled')
        } else {
            //$('#' + fieldToUpdate + 'devlist').html('<button type="submit" class="list-group-item">' + $(jq('settings['+fieldToUpdate+']')).attr('placeholder') + '</button>')
            $(document.getElementById(fieldToUpdate + 'devlist')).html($(jq('settings[' + fieldToUpdate + ']')).attr('placeholder'))
            //$('#' + fieldToUpdate + 'devlist').parent().attr('data-empty', 'true')
            $(document.getElementById(fieldToUpdate + 'devlist')).parent().addClass('device-btn-empty')
            $(document.getElementById(fieldToUpdate + 'devlist')).parent().removeClass('device-btn-filled')
        }
        log("hiding dropdown")
        dropdown.hide()
        event.preventDefault()
        event.stopPropagation()
    }
});

function updateSelect(selectItem) {
    log("update Select called")
    var optionDefault = selectItem.find(".optiondefault");
    if (selectItem.prop('selectedIndex') != 0) {
        //console.log("if");
        optionDefault.prop('disabled', false);
        optionDefault.css('display', 'block');
        optionDefault.removeAttr("selected");
        optionDefault.html("No selection");
        selectItem.prop('selected', true);
        //selectItem.trigger('change')
    } else {
        //console.log("else");
        optionDefault.prop('disabled', true);
        optionDefault.css('display', 'none');
        optionDefault.attr("selected", "selected");
        optionDefault.html("Click to set");
        selectItem.val(null) //.trigger('change');
    }
}

$(document).on('mousedown', 'label.device-select-item', function () {
    log("mousedown on a label with device-select-item class")
    var $self = $(this);
    if ($self.hasClass('is-checked')) {
        var uncheck = function () {
            setTimeout(function () {
                $self.removeClass('is-checked');
            }, 0);
        };
        var unbind = function () {
            $self.unbind('mouseup', up);
        };
        var up = function () {
            uncheck();
            unbind();
        };
        $self.bind('mouseup', up);
        $self.one('mouseout', unbind);
    }
});

function buttonClick(e) {
    log("buttonClick function called")
    if(confirmed != false) {
        confirmed = true;
        var btn = $(e).siblings('input:hidden').attr('name')
        var type = $(e).parent().prev().find("[name$='.type']")
        var soc = $(e).hasClass('submitOnChange')
        localStorage.setItem('scrollPosApp' + appId, $('.mdl-layout__content').scrollTop())
        $.post("/installedapp/btn",
            JSON.parse("{ \"id\": \"" + appId + "\" , \"" + btn + "\" : \"clicked\", \"name\" : \"" + type.attr('name').replace('.type', '') + "\", \"" + type.attr('name') + "\" : \"button\", \"currentPage\" :\"{{configPage.name}}\" }"),
            function (msg) {
                if (msg.status == "success") {
                    if (soc) {
                        changeSubmit(e)
                    } else {
                        window.location.reload()
                    }
                }
            }, "json");
    }
}

function changeSubmit(source) {
    log("changeSubmit function called")
    localStorage.setItem('scrollPosApp' + appId, $('.mdl-layout__content').scrollTop())
    if ($(source).attr('type') == 'checkbox') {
        var name = "[name='" + source.id + "']"
        $(name).val($(source).parent().is('.is-checked'))
        source.value = $(source).parent().is('.is-checked')
    }
    log("jsonSubmit called")
    jsonSubmit(source.name, source.value, false)
}

$(document).on('click', 'input[type=button], button[type=button]', function (e) {
    log("click event from input type of button or button type of button")
    if (e.target.value == "Remove") {
        log("button value is Remove")
        if (!confirm('Are you sure?')) {
            e.preventDefault()
        } else {
            log("jsonSubmit called")
            jsonSubmit(e.target.name, e.target.value)
        }
    } else if (e.target.value == "button") {
        //in btn
        log("button value is button, calling buttonClick()")
        buttonClick(this)
    } else if ($(e.currentTarget).data('toggle') == "modal" || $(e.currentTarget).hasClass("device-text") || $(e.currentTarget).hasClass("close")) {
        log("button data is modal or has class device-text or has class close so doing nothing")
        //in capability / device pop up
    } else {
        //new page navigation
        log("button default action, should be a page navigation request")
        var stateObj = {previousPage: model.configPage.previousPage, currentPage: model.configPage.name}
        log("name" + model.configPage.name)
        var path = window.location.pathname
        //path = "/installedapp/configure/" + appId + "/" +model.configPage.name
        history.pushState(stateObj, "", path)
        localStorage.setItem('scrollPosApp' + appId, 0)
        jsonSubmit(e.currentTarget.name, e.currentTarget.value, true)
    }
})

var jsonSubmit = function (source, value, validate) {
    //console.log('in jsonSubmit')
    if (validate) {
    var req = $('.required, :input[required]:visible, is-invalid')
    var complete = true;
    var errorCount = 0;
    if (!$('#formApp')[0].checkValidity()) {
        $('#formApp input:not(:hidden)').each(function (i, val) {
            if (!$(val).next().hasClass('validation')) {
                $(val).after('<div class="validation">' + val.validationMessage + '</div>')
            }
        })
        complete = false
        errorCount++
    }
    $(req).each(function (index, val) {
        if (!val.checkValidity()) {
            errorCount++
            complete = false
        }
        $(val).each(function (i, v) {
            if (v.name && v.name.indexOf("settings[") != -1) {
                var x = document.getElementById(v.name)
                if (x && typeof x.selectedOptions != 'undefined') {
                    if (x.selectedOptions.length == 0) {
                        complete = false
                        errorCount++
                        req.css("border", "1px solid #CC2D3B")
                        req.filter("select").parent().css("border", "1px solid #CC2D3B")
                        $(val).parent(".form-group").css("border", "1px solid #CC2D3B")
                    }
                } else {
                    if (v.value.length == 0) {
                        complete = false
                        errorCount++
                        req.css("border", "1px solid #CC2D3B")
                        req.filter("select").parent().css("border", "1px solid #CC2D3B")
                        $(val).parent(".form-group").css("border", "1px solid #CC2D3B")
                    }
                }
            }
        });
        if (complete == false) {
            log("form complete is false")
            req.css("border", "1px solid #CC2D3B")
            req.filter("select").parent().css("border", "1px solid #CC2D3B")
            if (errorCount > 0) {
                //alert("Required Fields missing. Please complete the required fields (ones with *)")
            }
            //return
        }
    })
    if ($('.device-btn-empty.btn-device-required').length > 0) {
        req.css("border-bottom", "1px solid #CC2D3B")
        req.filter("select").parent().css("border", "1px solid #CC2D3B")
        complete = false
        alert("Please complete the required fields (ones with a *)")
        //return
    }
}

    if (refreshInterval) {
        log("clearing refreshInterval")
        clearInterval(refreshInterval)
    }
    var $inputs = $('.form :input, .form select, .form textarea').not(':input[type=button]');
    var values = {};
    if (source != null) {
        values[source] = value
    }
    $inputs.each(function (key, value) {
        if (this.type.startsWith("select") && this.multiple == true) {
            values[this.name] = JSON.stringify($(this).val()).toString()
        } else {
            if (this.type.startsWith("select") == false && this.type.startsWith("hidden") == false) {
                values[this.name] = removeTags($(this).val())
            } else {
                values[this.name] = $(this).val()
            }
        }
    });
    if (!validate || complete) {
        log("if not validate and is complete (true)")
        $('.form').css({'pointer-events': 'none', 'opacity': '1'})
        $('.buttons.form-actions').prop('disabled', true)
        $(".mdl-layout__header-row .mdl-spinner").show()
        log("posting data to update/json endpoint")
        $.post("/installedapp/update/json", values, function (data) {
            if (data.status == "success") {
                log("got data back / success")
                if (data.location) {
                    log("got a location, redirecting")
                    window.location = data.location
                } else {
                    log("got data rendering new view")
                    model = data;
                    if (!model.toString().startsWith('<!doctype html>')) {
                        var template = Handlebars.templates['main'](data)
                        var placeholder = $('main')
                        placeholder.html(template)
                        componentHandler.upgradeDom()
                        updateSelect2()
                        $('.form').css({'pointer-events': 'unset', 'opacity': '1'})
                        $('.buttons.form-actions').prop('disabled', false)
                        $(".mdl-layout__header-row .mdl-spinner").hide()
                    } else {
                        var template = "<div class=\"mdl-grid\"><div class=\"mdl-card mdl-shadow--2dp mdl-cell mdl-cell--10-col\" style=\"float: none;margin: 0 auto;\"><div class=\"panel-body\"><h2 style=\"padding:8px;\">Unexpected Error</h2><h4 style=\"padding:8px;\">An unexpected error has occurred trying to load the app. Check <a href=\"/logs\">Logs</a> for more information.</h4></div></div></div>"
                        var placeholder = $('main')
                        placeholder.html(template)
                        componentHandler.upgradeDom()
                    }
                    //console.log(nextElement)
                    //if(nextElement && nextElement.length > 0 && nextElement[0].id && document.getElementById(nextElement[0].id)) {
                    // document.getElementById(nextElement[0].id).focus()
                    //}
                    $('.mdl-layout__content').scrollTop(localStorage.getItem('scrollPosApp' + appId))
                    if (document.title != data.app.label) {
                        var name = data.app.name
                        if (data.app.label) {
                            name = data.app.label
                        }
                        document.title = stripHtml(name)
                        $('.mdl-layout__header').find('h5').html(name)
                    }
                    log("in appUI refresh interval is " + data.configPage.refreshInterval)
                    if (parseInt(data.configPage.refreshInterval) > 0) {
                        log("refreshInterval is " + data.configPage.refreshInterval)
                        clearInterval(refreshInterval)
                        refreshInterval = setInterval(function () {
                            log("calling /update/json from refreshInterval Timer")
                            var path = window.location.pathname.replace('/configure/', '/configure/json/')
                            if (pageName != "" && pageName != path.split('/')[path.split('/').length - 1]) {
                                path += "/" + pageName
                            }
                            $.getJSON(path, function (data) {
                                try {
                                    model = data
                                    if (!model.toString().startsWith('<!doctype html>')) {
                                        var template = Handlebars.templates['main'](model)
                                        var placeholder = $('main')
                                        placeholder.html(template)
                                        componentHandler.upgradeDom()
                                        updateSelect2()
                                        $('.form').css({'pointer-events': 'unset', 'opacity': '1'})
                                        log(data.configPage.refreshInterval)
                                        if (parseInt(data.configPage.refreshInterval) <= 0) {
                                            clearInterval(refreshInterval)
                                        }
                                    } else {
                                        var template = "<div class=\"mdl-grid\"><div class=\"mdl-card mdl-shadow--2dp mdl-cell mdl-cell--10-col\" style=\"float: none;margin: 0 auto;\"><div class=\"panel-body\"><h4>An unexpected Error has occurred trying to load the app. Check logs for more information.</h4></div></div></div>"
                                        var placeholder = $('main')
                                        placeholder.html(template)
                                        componentHandler.upgradeDom()
                                    }
                                } catch (e) {
                                    $('.panel-body').html('Error Getting Page Data... ' + e)
                                }
                            })
                        }, parseInt(model.configPage.refreshInterval) * 1000)
                    } else {
                        clearInterval(refreshInterval)
                    }
                    if (validate == true) {
                        log("validate is true")
                        var stateObj = {previousPage: model.configPage.previousPage, currentPage: model.configPage.name}
                        var path = window.location.pathname.split('/')
                        if (path.indexOf(model.configPage.name) > -1 && path[path.length - 1] == model.configPage.name || model.configPage.name == undefined) {
                            //contains page name don't add it
                            path = path.join('/')
                        } else {
                            if (path.indexOf(model.configPage.name) > -1) {
                                path.splice(path.indexOf(model.configPage.name) + 1, path.length - path.indexOf(model.configPage.name))
                                path = path.join('/')
                            } else {
                                path = path.join('/') + "/" + model.configPage.name
                            }
                        }
                        log("name" + model.configPage.name)
                        log("updating window history with replaceState")
                        window.history.replaceState(stateObj, "", path)
                        return false;
                    }
                }
            }
        }, "json")
            .fail(function () {
                var template = "<div class=\"mdl-grid\"><div class=\"mdl-card mdl-shadow--2dp mdl-cell mdl-cell--10-col\" style=\"float: none;margin: 0 auto;\"><div class=\"panel-body\"><h2 style=\"padding:8px;\">Unexpected Error</h2><h4 style=\"padding:8px;\">An unexpected error has occurred trying to load the app. Check <a href=\"/logs\">Logs</a> for more information.</h4></div></div></div>"
                var placeholder = $('main')
                placeholder.html(template)
                componentHandler.upgradeDom()
            })
    } else {
        if (errorCount > 0) {
            alert("Required Fields missing or not passing validation. Please check red underlined fields and complete the required fields (ones with *)")
        }
    }

}

window.addEventListener("popstate", function (e) {
    log("Back or Forth Browser action")
    var path = window.location.pathname.split('/')
    path.splice(0, 4)
    if (e.state) {
        log("calling jsonSubmit with currentPage href action")
        //Fix breadcrumb
        var breadcrumb = $('#pageBreadcrumbs').val()
        log(breadcrumb)
        var decodedBreadcrumbs = JSON.parse(decodeURIComponent(breadcrumb))
        log(decodedBreadcrumbs)
        log(model.configPage.name)
        if (decodedBreadcrumbs.indexOf(model.configPage.name) > -1) {
            decodedBreadcrumbs.splice(decodedBreadcrumbs.indexOf(model.configPage.name), 1)
            log(encodeURIComponent(JSON.stringify(decodedBreadcrumbs)))
            $('#pageBreadcrumbs').val(encodeURIComponent(JSON.stringify(decodedBreadcrumbs)))
            log($('#pageBreadcrumbs').val())
        } else {
            $('#pageBreadcrumbs').val(encodeURIComponent(JSON.stringify(path)))
        }

        jsonSubmit("_action_href_name|" + e.state.currentPage + "|1", "", true)
    } else {
        log("calling jsonSubmit with path last slash href action")
        jsonSubmit("_action_href_name|" + path[path.length - 1] + "|1", "", true)
    }
})

var updateSelect2 = function () {
    log("in updateSelect2 function")
    $('.buttons.form-actions').prop('disabled', false)
    $('.selectpicker:not([multiple])').each(function (key, value) {
        var optionDefault = $(value).find(".optiondefault");
        //console.log("in required single select")
        optionDefault.prop('disabled', false);
        optionDefault.css('display', 'block');
        optionDefault.removeAttr("selected");
        if ($(value).prop('selectedIndex') != 0) {
            optionDefault.html("No selection")
        } else {
            optionDefault.html($(value).attr('placeholder'));
        }

        $(value).SumoSelect({
            placeholder: $(value).attr('placeholder'),
            forceCustomRendering: false,
            nativeOnDevice: [],
            floatWidth: 300
        });
        if ($(value).prop('selectedIndex') == 0) {
            $(value)[0].nextElementSibling.getElementsByTagName('span')[0].innerHTML = $(value).attr('placeholder');
        }

        $(value).on('sumo:closed', function (e) {
            $(value).trigger('change') //is this needed?
            if ($(this).hasClass('submitOnChange')) {
                changeSubmit(this);
            }
        });
    })

    $("select[multiple].selectpicker").each(function () {
        $(this).SumoSelect({
            placeholder: $(this).attr('placeholder'),
            triggerChangeCombined: true,
            csvDispCount: 0,
            outputAsCSV: false,
            isClickAwayOk: true,
            forceCustomRendering: false,
            nativeOnDevice: [],
            floatWidth: 300
        });
        $(this).on('sumo:closed', function (e) {
            if ($(this).hasClass('submitOnChange')) {
                changeSubmit(this);
            }
        });
    });
    $.each($('.hideable'), function (key, value) {
        var target = $(value).data("target");
        //var collapsed = localStorage.getItem('collapsed|' + appId +"|"+ target)
        //if(collapsed == "true") {
        //    $("#" + target).hide()
        //    $(value).addClass('collapsed')
        //}
        //if(collapsed == "false") {
        //    $("#" + target).show()
        //    $(value).removeClass('collapsed')
        //}
    })
    var safari = false
    if ((navigator.userAgent.indexOf("Safari") > -1 &&
        navigator.userAgent.indexOf("Chrome") == -1) ||
        navigator.userAgent.indexOf("iPad") > -1 ||
        navigator.userAgent.indexOf("iPhone") > -1) {
        safari = true;
    }
    if (safari || clock == "24") {
        log("Browser is safari")
        $(".safariOnly").show();
        $('input[type="time"]').hide();
        $(".timeSetting").each(function (key, value) {
            var index = "#" + value.name
            var elementName = index.split("[")[1];
            var value = $(value).val();
            if (value != null) {
                var hours = "input[name='hours[" + elementName + "']";
                var minutes = "input[name='minutes[" + elementName + "']";
                var amPm = "#amPm-" + elementName.replace("]", "");
                if (clock == "24") {
                    $(amPm).parent().hide()
                    $(hours).val(value.split(':')[0]);
                } else {
                    if (value.split(":")[0] >= 12) {
                        $(amPm).val("PM");
                        if (value.split(":")[0] == 12) {
                            $(hours).val(parseInt(value.split(':')[0]));
                        } else {
                            $(hours).val(parseInt(value.split(':')[0]) - 12);
                        }
                    } else {
                        $(amPm).val("AM");
                        if (value.split(":")[0] == "00") {
                            $(hours).val(parseInt(value.split(':')[0]) + 12);
                        } else {
                            $(hours).val(value.split(':')[0]);
                        }
                    }
                }
                $(minutes).val(value.split(':')[1]);
            }
        });
    }
}

$(document).on('blur, change', ".hours, .minutes", function (e) {
    //console.log(this.id + ":" + $(this).val())
    var hiddenValue = "input[name='settings[" + this.id.split("[")[1] + "']";
    var hiddenTime = $(hiddenValue).val(); //in 24 hour format
    //console.log(hiddenTime);
    var time = hiddenTime.split(":")
    time[0] = ("0" + $(this).parent().parent().find('.hours').val()).slice(-2)
    time[1] = $(this).parent().parent().find('.minutes').val()
    if (time[0] == "" && time[1] == "") {
        log("24 hour time is : empty");
        $(hiddenValue).val("").trigger('change');
    } else {
        if (time[0] == "") time[0] = "12"
        if (time[1] == "") time[1] = "00"
        if (this.id.split("[")[0] == "hours") {
            if (clock == "24") {
                time[0] = ("0" + $(this).val()).slice(-2)
            } else {
                if (parseInt($(this).val()) <= 12 && $("#amPm-" + this.id.split("[")[1].replace("]", "")).val() == "PM") {
                    time[0] = parseInt($(this).val()) + 12
                } else {
                    time[0] = ("0" + $(this).val()).slice(-2)
                }
            }
        }
        if (this.id.split("[")[0] == "minutes" && $(this).val() != "") {
            log("minutes" + parseInt($(this).val()) + (parseInt($(this).val()) < 10))
            time[1] = ("0" + $(this).val()).slice(-2)
        }
        log("24 hour time is : " + time.join(":"));
        $(hiddenValue).val(time.join(":")).trigger('change');
    }
});

$(document).on('change', '.amPm', function () {
    var hiddenValue = "input[name='settings[" + this.id.split("-")[1] + "]']";
    var hiddenTime = $(hiddenValue).val(); //in 24 hour format
    var time = hiddenTime.split(":")
    log($(this).val())
    if ($(this).val() == "PM" && time[0] < 12) time[0] = parseInt(time[0]) + 12
    if ($(this).val() == "AM" && time[0] >= 12) time[0] = parseInt(time[0]) - 12
    time[0] = ("0" + time[0]).slice(-2)
    time[1] = ("0" + time[1]).slice(-2)
    $(hiddenValue).val(time.join(":")).trigger('change');
    log("am/pm function 24 hour time is : " + time.join(":"));
});

function openWindow(site) {
    log("in openWindow function")
    var popUp = window.open(site.href, site.title, 'resizable,height=' + window.innerHeight + ',width=800,left=' + ((window.innerWidth / 2) - (800 / 2)));
    if (popUp == null || typeof (popUp) == 'undefined') {
        alert('Please allow pop up windows for Hubitat in your browser to continue.');
    } else {
        popUp.focus();
        var timer = setInterval(function () {
            if (popUp.closed) {
                clearInterval(timer);
                document.getElementsByTagName('html')[0].style.cursor = 'wait'
                document.getElementById('formApp').submit();
            }
        }, 1000);
    }
}

$(document).ready(function () {
    $(window).keydown(function (e) {
        if (e.keyCode == 13 && e.target.type != "textarea") {
            $(e.target).blur()
            e.preventDefault();
            return false;
        }
    });
    $(document).on('click', '.dd', function (e) {
        e.preventDefault()
        $(this).parent().siblings('input').val($(this).data('value'))
        $(this).parent().toggle()
        changeSubmit(this);
    })

    $(document).on('click', '.dropbtn', function (e) {
        e.preventDefault()
        $(this).siblings('.dropdown-content').toggle()

    })
});

function log(msg) {
    if (debug == "true") {
        console.log(msg)
    }
}

var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';

var tagOrComment = new RegExp(
    '<(?:'
    // Comment body.
    + '!--(?:(?:-*[^->])*--+|-?)'
    // Special "raw text" elements whose content should be elided.
    + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
    + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
    // Regular name
    + '|/?[a-z]'
    + tagBody
    + ')>',
    'gi');

function removeTags(html) {
    var oldHtml;
    do {
        oldHtml = html;
        html = html.replace(tagOrComment, '');
    } while (html !== oldHtml);
    return html.replace(/</g, '&lt;');
}
