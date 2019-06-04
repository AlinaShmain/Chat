import { filter, find, pickBy, isNil, isEmpty } from 'lodash';
import EventEmitter from 'event-emitter-es6';


class Request {
    constructor(url) {
        this.url = url;
    }

    httpGet() {
        return axios.get(this.url);
    }

    httpPost(msg) {
        return axios.post(this.url, msg);
    }

    httpPut(msgId, content) {
        return axios.put(this.url + '/' + msgId, {
            text: content
        });
    }

    httpDelete(msgId) {
        return axios.delete(this.url + '/' + msgId);
    }
};

const URL = 'http://localhost:8080/api/chat/message',
    CHECK_INTERVAL = 10000,
    DISPLAY_DELAY = 3000,
    ANIMATE_SPEED = 500;


class ChatView extends EventEmitter {

    constructor() {
        super();

        this.chatWindow = document.getElementById("chatWindow");
        this.btnsMenu = document.getElementsByClassName("button");
        this.editBtnMenu = document.getElementsByClassName("edit")[0];
        this.delBtnMenu = document.getElementsByClassName("del")[0];
        this.confirmEditBtn = document.getElementsByClassName("editMsg")[0];
        this.sendMsgBtn = document.getElementsByClassName("newMsg")[0];
        this.input = document.getElementById("chatInput");
    }

    displayMsgs(msgs) {
        msgs.forEach((msg) => {
            this.createElem(msg);
        });
        let y = this.chatWindow.scrollHeight;
        this.chatWindow.scrollTo(0, y);
    }

    createElem(data, scroll = false) {
        let messageForm = $("<div></div>", { 'data-id': data.id });
        let name = $("<p></p>", { 'class': 'username' });
        let text = $("<p></p>", { 'class': 'speech-bubble', 'text': data.text });
        let status = $("<p></p>", { 'class': 'status' });

        if (data.myMessage != null) {
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
    }

    chosenMsg() {
        $(this).toggleClass("chosenMsg");
        // classList.toggle('')

        if ($(".chosenMsg").length) {
            if ($(".chosenMsg.container-left").length || $(".chosenMsg.container-right").length > 1) {
                $(".del").css("display", "inline-block");
                $(".edit").css("display", "none");
            } else {
                $(".del, .edit").css("display", "inline-block");
            }
        } else {
            $(".del, .edit").css("display", "none");
            $(".editMsg").css("display", "none");
            $(".newMsg").css("display", "block");
        }

        $("#chatInput").val("");
    }

    getText() {
        let userMsg = this.input.value;
        this.input.value = '';
        return userMsg;
    }

    displayStatus(oldId, newId, notifText) {
        console.log(oldId);
        if (oldId != newId)
            this.changeId(oldId, newId);
        let elem = document.querySelectorAll(`[data-id="${newId}"]`)[0];
        console.log(elem);
        let status = $(elem).children(".status");
        status.text(notifText);
        if (notifText.startsWith('not')) {
            status.css("color", "#EB0000");
        }
        status.css("display", "inline-block");

        setTimeout(() => {
            status.css("display", "none")
        }, DISPLAY_DELAY);
    }

    changeId(oldId, newId) {
        let elem = document.querySelectorAll(`[data-id="${oldId}"]`)[0];
        elem.setAttribute("data-id", newId);
    }

    hideMsg() {
        let msgs = document.getElementsByClassName("chosenMsg");
        console.log(msgs);
        // Array.from(msgs).forEach((msg) => { 
        //     console.log(msg);
        //     msg.classList.remove("chosenMsg"); 
        // });

        // Object.keys(msgs).forEach((key) => {
        //     console.log(msgs[key]);
        //     msgs[key].classList.remove("chosenMsg");
        // });
        // filter(msgs, msg => { console.log(msg); msg.classList.remove("chosenMsg"); });
        for(let i=0; i<msgs.length;i++){
             console.log(msgs[i]);
            msgs[i].classList.remove("chosenMsg");
        }

        Object.keys(this.btnsMenu).forEach((key) => {
            console.log(this.btnsMenu[key]);
            this.btnsMenu[key].style.display = "none";
        });
        // filter(this.btnsMenu, btn => { btn.style.display = "none"; });
        this.confirmEditBtn.style.display = "none";

        if (window.confirm("Are you sure?")) {
            Array.from(msgs).forEach((i, msg) => {
                // $(msgs).each((i, msg) => {
                // let msg_id = $(msg).attr("data-id");
                // let msg_id = msg.getAttribute("data-id");
                msg.style.display = "none";
                // $(msg).css("display", "none");
                let msg_id = msg.getAttribute("data-id");
                this.emit('readyToDel', msg_id);
            });
        }
    }

    removeElem(id) {
        let elem = document.querySelectorAll(`[data-id="${id}"]`)[0];
        console.log(elem);
        elem.parentNode.removeChild(elem);
    }

    editMsg() {
        let msg = document.getElementsByClassName("chosenMsg")[0];

        if (this.confirmEditBtn.style.display == "block") {
            msg.classList.remove("chosenMsg");
            this.confirmEditBtn.style.display = "none";
            this.sendMsgBtn.style.display = "block";
            filter(this.btnsMenu, btn => { btn.style.display = "none"; });
            this.input.value = '';
        } else {
            this.sendMsgBtn.style.display = "none";
            this.confirmEditBtn.style.display = "block";

            let msgText = msg.childNodes[1].textContent;
            this.input.value = msgText;
            this.input.focus();
        }
    }

    onConfirm() {
        let editedTxt = this.input.value;

        if (editedTxt.trim()) {
            this.input.value = '';

            let msg = document.getElementsByClassName("chosenMsg")[0];
            let initTxt = msg.childNodes[1].textContent;
            msg.childNodes[1].textContent = editedTxt;

            msg.classList.remove("chosenMsg");
            filter(this.btnsMenu, btn => { btn.style.display = "none"; });
            this.confirmEditBtn.style.display = "none";
            this.sendMsgBtn.style.display = "block";

            let id = msg.getAttribute("data-id");

            this.emit('readyToEdit', id, editedTxt);
        }
    }

    handleErrorSend(id) {
        let elem = document.querySelectorAll(`[data-id="${id}"]`)[0];
        elem.removeEventListener("click", this.chosenMsg);

        setTimeout(() => {
            this.removeElem(id);
        }, DISPLAY_DELAY);
    }

    handleErrorEdit(msg) {
        let elem = document.querySelectorAll(`[data-id="${msg.id}"]`)[0];
        elem.childNodes[1].textContent = msg.text;
    }
};

class ChatModel extends EventEmitter {
    constructor(url) {
        super();
        this.url = url;
        this.request = new Request(this.url);
        this.user = null;
        this.messages = [];
    }

    init() {
        axios.head(this.url)
            .then(response => {
                console.log("auth");
                this.authorize()
                    .then(name => {
                        this.user = name;
                        // $("#app").css("display", "block");
                        this.loadData();
                    });
            }).catch(error => {
                let text = "Something went wrong";
                if (error.response) {
                    if (error.response.status == 404) {
                        text = error.response.status + " " + error.response.statusText;
                    }
                    // $("<div></div>", { "class": "error" }).text(text).appendTo($("body"));
                }
            });
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

    cleanEmptyData(data) {
        if (!isEmpty(data)) {
            return filter(data, (obj) => { return isEmpty(pickBy(obj, isNil)); });
        } else return null;
    }

    loadData() {

        // let test = [{ id: 2, text: "Test message", username: "Test" },
        //     { id: 16, text: null, username: "ed" },
        //     { id: 17, text: "rqq", username: "fre" },
        //     { id: 19, text: "wrtrwt", username: "fwr" },
        //     { id: 36, text: "sts6w4", username: "" }
        // ];

        // let array_of_non_empty_objects = filter(test, (obj) => { return isEmpty(pickBy(obj, isNil)); });
        // let array_of_non_empty_objects = reject(test, (obj) => { return !isEmpty(pickBy(obj, isNil)); });
        // console.log(array_of_non_empty_objects);

        this.messages = localStorage.getItem('messages');
        if (this.messages) {
            this.messages = JSON.parse(localStorage.getItem('messages'));
            this.emit('dataLoaded', this.messages);
        } else {
            this.request.httpGet()
                .then(
                    response => {
                        // if (!isEmpty(response.data)) {
                        //     let array_of_not_empty_objects = filter(response.data, (obj) => {
                        //         return isEmpty(pickBy(obj, isNil));
                        //     });
                        //     if (isEmpty(array_of_not_empty_objects)) {
                        let array_of_not_empty_objects = this.cleanEmptyData(response.data);
                        if (array_of_not_empty_objects) {
                            response.data.reverse();
                            localStorage.setItem('messages', JSON.stringify(response.data));
                            this.messages = response.data;
                            console.log(this.messages);
                            this.emit('dataLoaded', this.messages);
                        }
                        // }
                        setInterval(this.checkToUpdate(), CHECK_INTERVAL);
                    });
        }
    }

    checkToUpdate() {
        return () => {
            this.request.httpGet()
                .then(
                    response => {
                        let array_of_not_empty_objects = this.cleanEmptyData(response.data);
                        if (array_of_not_empty_objects) {
                            response.data.reverse();

                            console.log(response.data);
                            this.differences(response.data, this.messages);
                        }
                    });
        };
    }

    differences(a, b) {

        filter(a, x => { //In a and not in b
            if (find(b, ['id', x.id]) == undefined) {
                console.log('new ' + x.id);
                this.messages.push(x);
                localStorage.setItem('messages', JSON.stringify(this.messages));
                this.emit("newMessage", x);
            }
        });

        filter(b, (x, i) => { //In b and not in a
            if (find(a, ['id', x.id]) == undefined) {
                console.log('del ' + x.id);
                this.messages.splice(i, 1);
                localStorage.setItem('messages', JSON.stringify(this.messages));
                this.emit("deleted", x.id)
            }
        });

        // filter(a, x => { //In b and not in a
        //     if (find(b, ['text', x.text]) == undefined) {
        //         console.log('diff value ' + x.text);
        //         this.messages.splice(i, 1);
        //         localStorage.setItem('messages', JSON.stringify(this.messages));
        //         // this.emit("edited", x.text)
        //     }
        // });

        // a.filter(x => { //in a and b but different values
        //     if (!b.find(el => x.text == el.text)) {
        //         console.log('diff values ' + x);
        //         // let elem = $("div").find("[data-id='" + x.id + "']");
        //         // elem.children(".speech-bubble").text(x.text);
        //         // let idx = this.messages.findIndex(k => k.id == x.id);
        //         // this.messages[idx].text = x.text;
        //     }
        // });
    }

    send(userMsg) {
        let msg = {
            id: this.messages[this.messages.length - 1].id + 1,
            text: userMsg,
            username: this.user,
            myMessage: true
        };

        this.emit('newMessage', msg);
        this.messages.push(msg);
        localStorage.setItem('messages', JSON.stringify(this.messages));
        this.request.httpPost(msg)
            .then(response => {
                if (response.data[0].username == this.user &&
                    response.data[0].text == msg.text && response.data[0].id != msg.id) {
                    this.emit('requestSent', msg.id, response.data[0].id, "delivered");
                    let idx = this.messages.findIndex(elem => { return elem.id == msg.id; });
                    // let idx = findIndex(this.messages, () => return elem.id == msg.id);

                    this.messages[idx].id = response.data[0].id;
                    localStorage.setItem('messages', JSON.stringify(this.messages));
                } else {
                    this.emit('requestSent', msg.id, msg.id, "delivered");
                }
            }).catch(error => {
                if (error.response) {
                    this.emit('requestSent', msg.id, msg.id, "not delivered");
                    let idx = this.messages.findIndex(el => el.id == msg.id);
                    this.messages.splice(idx, 1);
                    localStorage.setItem('messages', JSON.stringify(this.messages));
                    this.emit('errorSent', msg.id);
                }
            });
    }

    remove(msg_id) {
        this.request.httpDelete(msg_id)
            .then(
                response => {
                    console.log('deleted');
                    let idx = this.messages.findIndex(el => { return el.id == msg_id; });
                    console.log(this.messages[idx]);
                    this.messages.splice(idx, 1);
                    localStorage.setItem('messages', JSON.stringify(this.messages));
                    this.emit('deleted', msg_id);
                });
    }

    confirmEdit(id, txt) {
        let idx = this.messages.findIndex(elem => elem.id == id);
        let initTxt = this.messages[idx].text;
        this.messages[idx].text = txt;
        localStorage.setItem('messages', JSON.stringify(this.messages));

        this.request.httpPut(id, txt)
            .then(() => {
                this.emit('requestSent', id, id, "edited");
            }).catch(error => {
                if (error.response) {
                    this.emit('requestSent', id, id, "not edited");
                    this.messages[idx].text = initTxt;
                    localStorage.setItem('messages', JSON.stringify(this.messages));
                    this.emit('errorEdit', this.messages[idx]);

                    // msg.children(".speech-bubble").text(initMsg);
                }
            });
    }
};

class ChatController extends EventEmitter {

    constructor(view, model) {
        super();

        this.view = view || new View();
        this.model = model || new Model(URL);

        this.model.on('dataLoaded', data => this.view.displayMsgs(data));
        this.model.on('newMessage', msg => this.view.createElem(msg, true));
        this.model.on('requestSent', (oldId, newId, notifText) => this.view.displayStatus(oldId, newId, notifText));
        this.view.on('readyToDel', msg_id => this.model.remove(msg_id));
        this.model.on('deleted', id => this.view.removeElem(id));
        this.view.on('readyToEdit', (id, txt) => { this.model.confirmEdit(id, txt); });
        this.model.on('errorSent', id => this.view.handleErrorSend(id));
        this.model.on('errorEdit', msg => this.view.handleErrorEdit(msg));
    }

    init() {
        this.connectElements('button', 'click');
        this.model.init();
    }

    connectElements(selector, event) {
        let els = document.querySelectorAll(selector);
        for (let el of els)
            el.addEventListener(event, e => this.eventHandler(e));
    }

    eventHandler(e) {
        console.log(e);
        switch (e.target.getAttribute('mvc-do')) {
            case 'delete':
                this.view.hideMsg();
                break;
            case 'edit':
                this.view.editMsg();
                break;
            case 'send':
                let msgTxt = this.view.getText();
                if (msgTxt.trim()) {
                    this.model.send(msgTxt);
                }
                break;
            case 'confirm':
                this.view.onConfirm();
                break;
            default:
                return;
        }
    }
};


document.addEventListener('DOMContentLoaded', function() {

    const chatV = new ChatView(),
        chatM = new ChatModel(URL),
        chat = new ChatController(chatV, chatM);

    chat.init();
});