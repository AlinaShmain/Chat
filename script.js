window.onload = function() {

    const URL = 'http://localhost:8080/api/chat/message',
        CHECK_INTERVAL = 6000,
        DISPLAY_DELAY = 3000,
        ANIMATE_SPEED = 500;

    let instance = null;

    class Chat {

        constructor(url) {
            if (!instance) {
                instance = this;
            }
            this.url = url;
            this.user = null;
            this.messages = [];
            this.lastMsgId = -1;
            return instance;
        }

        authorize() {
            return new Promise(resolve => {
                this.user = localStorage.getItem('user');
                if (this.user) {
                    this.user = JSON.parse(localStorage.getItem('user'));
                    resolve(this.user);
                } else {
                    $.xPrompt({ header: 'Enter name:', placeholder: 'type here' }, (name) => {
                        this.user = name;
                        localStorage.setItem('user', JSON.stringify(this.user));
                        resolve(this.user);
                    })
                }
            });
        }

        displayMsgs() {
            this.messages.forEach((msg) => {
                (this.createElem(msg))();
                this.lastMsgId = msg.id;
            });
            $("#chatWindow").scrollTop($("#chatWindow")[0].scrollHeight);
        }

        loadBtns() {
            $("#newMsg").click(this.sendMsg());
            $(".del").click(this.removeMsg());
            $(".edit").click(this.editMsg);
            $("#editMsg").click(this.confirmEdit());
        }

        checkEmptyObj(data) {
            if (!$.isEmptyObject(data)) {
                $.each(data, (idx, obj) => {
                    if ($.isPlainObject(obj) || $.isArray(obj)) {
                        $.each(obj, (key, value) => {
                            if (typeof(value) == 'undefined' || value === null || value === "") {
                                console.log(data[idx]);
                                delete data[idx];
                            }
                        });
                    }
                });
                return data;
            } else {
                return null;
            }
        }

        loadData() {
            this.messages = localStorage.getItem('messages');
            if (this.messages) {
                this.messages = JSON.parse(localStorage.getItem('messages'));
                this.displayMsgs();
            } else {
                axios.get(this.url)
                    .then(
                        response => {
                            if (this.checkEmptyObj(response.data)) {
                                response.data.reverse();
                                localStorage.setItem('messages', JSON.stringify(response.data));
                                this.messages = response.data;
                                this.displayMsgs();
                            }
                        });
            }
            this.loadBtns();
            // setInterval(this.checkToUpdate(), CHECK_INTERVAL);
        }

        init() {
            axios.head(this.url)
                .then(response => {
                    this.authorize()
                        .then(name => {
                            this.user = name;
                            $("#app").css("display", "block");
                            this.loadData();
                        });
                })
                .catch(error => {
                    let text = "Something went wrong";
                    if (error.response) {
                        if (error.response.status == 404) {
                            text = error.response.status + " " + error.response.statusText;
                        }
                        $("<div></div>", { "class": "error" }).text(text).appendTo($("body"));
                    }
                });
        }

        saveMsg(msg) {
            (this.createElem(msg, true))();
            this.messages.push(msg);
            this.lastMsgId = msg.id;
            localStorage.setItem('messages', JSON.stringify(this.messages));
        }

        delMsg(msg, i) {
            msg.remove();
            this.messages.splice(i, 1);
            this.lastMsgId = this.messages[this.messages.length - 1].id;
            localStorage.setItem('messages', JSON.stringify(this.messages));
        }

        differences(a, b) {
            a.filter(x => { //In a and not in b
                if (!b.find(el => x.id == el.id)) {
                    console.log(x);
                    this.saveMsg(x);
                }
            });

            b.filter((x, i) => { //In b and not in a
                if (!a.find(el => x.id == el.id)) {
                    console.log(x);
                    let elem = $("div").find("[data-id='" + x.id + "']")[0];
                    this.delMsg(elem, i);
                }
            });

            a.filter(x => { //in a and b but different values
                if (!b.find(el => x.text == el.text)) {
                    console.log(x);
                    let elem = $("div").find("[data-id='" + x.id + "']");
                    elem.children(".speech-bubble").text(x.text);
                    let idx = this.messages.findIndex(k => k.id == x.id);
                    this.messages[idx].text = x.text;
                }
            });
        }

        checkToUpdate() {
            return () => {
                axios.get(this.url)
                    .then(
                        response => {
                            if (this.checkEmptyObj(response.data)) {
                                response.data.reverse();
                                // обновляем id сообщений тек пользователя, кот на сервере получились другими. 
                                // если кто то например удалил последние сообщения
                                response.data.filter(x => {
                                    let m = this.messages.find(el => (x.id != el.id) &&
                                        (x.username == this.user) && (x.text == el.text));
                                    if (m) {
                                        let id = $(m)[$(m).length - 1].id;
                                        this.lastMsgId = id;
                                        let idx = this.messages.findIndex(elem => elem.id == id);
                                        this.messages[idx].id = x.id;
                                        $("[data-id = '" + id + "']").attr("data-id", x.id);
                                    }
                                });
                                this.differences(response.data, this.messages);
                            }
                        });
            };
        }

        createElem(data, scroll = false) {
            return () => {
                let messageForm = $("<div></div>", { 'data-id': data.id });
                let name = $("<p></p>", { 'class': 'username' });
                let text = $("<p></p>", { 'class': 'speech-bubble', 'text': data.text });
                let status = $("<p></p>", { 'class': 'status' });

                if (!data.myMessage) {
                    messageForm.addClass("container-right");
                    name.text(":Me");
                    text.addClass("right-bubble");
                    messageForm.append(status, text, name);
                } else {
                    messageForm.addClass("container-left");
                    name.text(data.username + ":");
                    text.addClass("left-bubble");
                    messageForm.append(name, text, status);
                }

                $("#chatWindow").append(messageForm);

                if (scroll) {
                    $("#chatWindow").animate({
                        scrollTop: $("#chatWindow")[0].scrollHeight
                    }, ANIMATE_SPEED);
                }

                messageForm.click(this.chosenMsg);
            };
        }

        handleErrorSend(id) {
            let idx = this.messages.findIndex(el => el.id == id);
            this.messages.splice(idx, 1);
            localStorage.setItem('messages', JSON.stringify(this.messages));
            this.lastMsgId = this.messages[this.messages.length - 1].id;
            $("[data-id = '" + id + "']").unbind('click', this.chosenMsg);
            let el = $("div").find("[data-id='" + id + "']")[0];
            setTimeout(() => {
                el.remove();
            }, DISPLAY_DELAY);
        }

        displayStatus(msg, notifText, error = false) {
            let status = $(msg).children(".status");
            status.text(notifText);
            if (error) {
                status.css("color", "#EB0000");
            }
            status.css("display", "inline-block");

            setTimeout(() => {
                status.css("display", "none")
            }, DISPLAY_DELAY);
        }

        sendMsg() {
            return () => {
                let userMsg = $("#chatInput").val();
                if (userMsg.trim()) {
                    $("#chatInput").val('');

                    let msg = {
                        id: Number(this.lastMsgId) + 1,
                        text: userMsg,
                        username: this.user,
                        myMessage: true
                    };

                    this.saveMsg(msg);
                    let elem = $("[data-id = '" + msg.id + "']");
                    axios.post(this.url, msg)
                        .then(
                            response => {
                                this.displayStatus(elem, "delivered");
                            })
                        .catch(error => {
                            if (error.response) {
                                this.displayStatus(elem, "not delivered", true);
                                this.handleErrorSend(msg.id);
                            }
                        });
                }
            };
        }

        confirmEdit() {
            return () => {
                let initMsg = $(".chosenMsg>.speech-bubble").text();
                let editedMsg = $("#chatInput").val();
                $("#chatInput").val("");

                $(".chosenMsg>.speech-bubble").text(editedMsg);
                let idx = this.messages.findIndex(elem => elem.id == $(".chosenMsg").attr("data-id"));
                this.messages[idx].text = editedMsg;

                let msg = $(".chosenMsg");
                msg.removeClass("chosenMsg");
                $(".del, .edit").css("display", "none");
                $("#editMsg").css("display", "none");
                $("#newMsg").css("display", "block");

                if (editedMsg.trim()) {
                    axios.put(this.url + '/' + msg.attr("data-id"), {
                            text: editedMsg
                        })
                        .then(() => { this.displayStatus(msg, "edited"); })
                        .catch(error => {
                            if (error.response) {
                            	msg.children(".speech-bubble").text(initMsg);
                                this.displayStatus(msg, "not edited", true);
                            }
                        });
                }
            };
        }

        chosenMsg() {
            $(this).toggleClass("chosenMsg");

            if ($(".chosenMsg").length) {
                if ($(".chosenMsg.container-left").length || $(".chosenMsg.container-right").length > 1) {
                    $(".del").css("display", "inline-block");
                    $(".edit").css("display", "none");
                } else {
                    $(".del, .edit").css("display", "inline-block");
                }
            } else {
                $(".del, .edit").css("display", "none");
            }

            $("#chatInput").val("");
        }

        removeMsg() {
            return () => {
                let msgs = $(".chosenMsg");
                $(msgs).removeClass("chosenMsg");
                $(".del, .edit").css("display", "none");
                $("#editMsg").css("display", "none");

                if (window.confirm("Are you sure?")) {
                    $(msgs).each((i, msg) => {
                        let msg_id = $(msg).attr("data-id");
                        let idx = this.messages.findIndex(el => el.id == msg_id);
                        $(msg).css("display", "none");

                        axios.delete(this.url + '/' + msg_id)
                            .then(
                                response => {
                                    this.delMsg(msg, idx);
                                })
                            .catch(error => {
                                if (error.response) {
                                    $(msg).css("display", "block");
                                    this.displayStatus(msg, "not deleted", true);
                                }
                            });
                    });
                }
            };
        }

        editMsg() {
            $("#newMsg").css("display", "none");
            $("#editMsg").css("display", "block");

            let msgText = $(".chosenMsg>.speech-bubble").text();
            $("#chatInput").val(msgText);
            $("#chatInput").focus();
        }
    };

    const chat = new Chat(URL);
    chat.init();
};