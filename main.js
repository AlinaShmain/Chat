import { filter, find, pickBy, isNil, isEmpty } from 'lodash';
import EventEmitter from 'event-emitter-es6';


const URL = 'http://localhost:8080/api/chat/message',
    CHECK_INTERVAL = 10000,
    DISPLAY_DELAY = 3000;


class Request {
    constructor(url) {
        this.url = url;
    }

    httpHead() {
        return axios.head(this.url);
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

    displayWindow() {
        let app = document.getElementById("app");
        app.style.display = "block";
    }

    displayMsgs(msgs) {
        msgs.forEach((msg) => {
            this.createElem(msg);
        });
        let y = this.chatWindow.scrollHeight;
        this.chatWindow.scrollTo(0, y);
    }

    createElem(data) {
        let messageForm = document.createElement('div');
        messageForm.setAttribute('data-id', data.id);

        let name = document.createElement('p');
        name.className = "username";

        let text = document.createElement('p');
        text.classList.add("speech-bubble");
        text.innerHTML = data['text'];

        let status = document.createElement('p');
        status.classList.add("status");

        if (data.myMessage != null) {
            messageForm.classList.add("container-right");
            this.chatWindow.appendChild(messageForm);

            messageForm.appendChild(status);

            name.innerHTML = ":Me";
            text.classList.add("right-bubble");

            messageForm.appendChild(text);
            messageForm.appendChild(name);
        } else {
            messageForm.className = "container-left";
            this.chatWindow.appendChild(messageForm);

            name.innerHTML = data['username'] + ":";
            text.classList.add("left-bubble");

            messageForm.appendChild(name);
            messageForm.appendChild(text);
            messageForm.appendChild(status);
        }

        let y = this.chatWindow.scrollHeight;
        chatWindow.scrollTo(0, y);

        messageForm.addEventListener('click', (evt) => {
            evt.target.classList.toggle("chosenMsg");
            this.chosenMsg();
        });
    }

    chosenMsg() {
        let msgs = document.getElementsByClassName("chosenMsg");
        let delBtn = document.getElementsByClassName("del")[0];
        let editBtn = document.getElementsByClassName("edit")[0];

        if (msgs.length > 1) {
            delBtn.style.display = "block";
            editBtn.style.display = "none";
        } else if (msgs.length == 1) {
            if (msgs[0].classList.contains("container-right")) {
                filter(this.btnsMenu, btn => { btn.style.display = "block"; });
            } else {
                delBtn.style.display = "block";
                editBtn.style.display = "none";
            }
        } else {
            filter(this.btnsMenu, btn => { btn.style.display = "none"; });
            this.confirmEditBtn.style.display = "none";
            this.sendMsgBtn.style.display = "block";
        }

        this.input.value = '';
    }

    getText() {
        let userMsg = this.input.value;
        this.input.value = '';
        return userMsg;
    }

    displayStatus(oldId, newId, notifText) {
        if (oldId != newId)
            this.changeId(oldId, newId);
        let elem = document.querySelectorAll(`[data-id="${newId}"]`)[0];

        let status = Array.from(elem.childNodes).find(node => { return node.classList.contains("status") });
        status.textContent = notifText;
        if (notifText.startsWith('not')) {
            status.style.color = "#EB0000";
        }
        status.style.display = "inline-block";

        setTimeout(() => {
            status.style.display = "none";
        }, DISPLAY_DELAY);
    }

    changeId(oldId, newId) {
        let elem = document.querySelectorAll(`[data-id="${oldId}"]`)[0];
        elem.setAttribute("data-id", newId);
    }

    onHide() {
        let msgs = document.getElementsByClassName("chosenMsg");

        let ids = [];
        Array.from(msgs).map((msg) => {
            ids.push(msg.getAttribute("data-id"));
            return msg;
        });

        Array.from(msgs).map((msg) => {
            msg.classList.remove("chosenMsg");
            return msg;
        });

        Array.from(this.btnsMenu).map((btn) => {
            btn.style.display = "none";
            return btn;
        });
        this.confirmEditBtn.style.display = "none";

        if (window.confirm("Are you sure?")) {
            Array.from(ids).map((id) => {
                let elem = document.querySelectorAll(`[data-id="${id}"]`)[0];
                elem.style.display = "none";
                let msg_id = elem.getAttribute("data-id");
                this.emit('readyToDel', msg_id);
            });
        }
    }

    removeElem(id) {
        let elem = document.querySelectorAll(`[data-id="${id}"]`)[0];
        elem.parentNode.removeChild(elem);
    }

    onEdit() {
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
            let id = msg.getAttribute("data-id");
            this.editElem(id, editedTxt);

            msg.classList.remove("chosenMsg");
            filter(this.btnsMenu, btn => { btn.style.display = "none"; });
            this.confirmEditBtn.style.display = "none";
            this.sendMsgBtn.style.display = "block";

            this.emit('readyToEdit', id, editedTxt);
        }
    }

    editElem(id, editedText) {
        let elem = document.querySelectorAll(`[data-id="${id}"]`)[0];
        elem.childNodes[1].textContent = editedText;
    }

    handleErrorLoad(text) {
        let notif = document.createElement('div');
        notif.classList.add("error");
        notif.textContent = text;

        document.body.appendChild(notif);
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

    handleErrorDelete(id) {
        let elem = document.querySelectorAll(`[data-id="${id}"]`)[0];
        elem.style.display = "block";
    }
};

class ChatModel extends EventEmitter {
    constructor(url) {
        super();
        this.request = new Request(url);
        this.user = null;
        this.messages = [];
    }

    init() {
        this.request.httpHead()
            .then(response => {
                this.authorize()
                    .then(name => {
                        this.user = name;
                        this.emit('launched');
                        this.loadData();
                    });
            }).catch(error => {
                let text = "Something went wrong";
                if (error.response) {
                    if (error.response.status == 404) {
                        text = error.response.status + " " + error.response.statusText;
                    }
                    this.emit('errorLaunch', text);
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
        this.messages = localStorage.getItem('messages');
        if (this.messages) {
            this.messages = JSON.parse(localStorage.getItem('messages'));
            this.emit('dataLoaded', this.messages);
        } else {
            this.request.httpGet()
                .then(
                    response => {
                        let array_of_not_empty_objects = this.cleanEmptyData(response.data);
                        if (array_of_not_empty_objects) {
                            response.data.reverse();
                            localStorage.setItem('messages', JSON.stringify(response.data));
                            this.messages = response.data;
                            this.emit('dataLoaded', this.messages);
                        }
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

                            this.differences(response.data, this.messages);
                        }
                    });
        };
    }

    differences(a, b) {

        filter(a, x => { //In a and not in b
            if (find(b, ['id', x.id]) == undefined) {
                this.messages.push(x);
                localStorage.setItem('messages', JSON.stringify(this.messages));
                this.emit("newMessage", x);
            }
        });

        filter(b, (x, i) => { //In b and not in a
            if (find(a, ['id', x.id]) == undefined) {
                this.messages.splice(i, 1);
                localStorage.setItem('messages', JSON.stringify(this.messages));
                this.emit("deleted", x.id)
            }
        });

        filter(a, x => { //In b and not in a
            if (find(b, ['text', x.text]) == undefined) {
                let idx = this.messages.findIndex(el => el.id == x.id);
                this.messages[idx].text = x.text;
                localStorage.setItem('messages', JSON.stringify(this.messages));
                this.emit("editElem", x.id, x.text);
            }
        });
    }

    onSend(userMsg) {
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
            .then(response => {
                let idx = this.messages.findIndex(el => { return el.id == msg_id; });
                this.messages.splice(idx, 1);
                localStorage.setItem('messages', JSON.stringify(this.messages));
                this.emit('deleted', msg_id);
            }).catch(error => {
                if (error.response) {
                    this.emit('errorRemove', msg_id);
                    this.emit('requestSent', msg_id, msg_id, "not deleted");
                }
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
                }
            });
    }
};

class ChatController extends EventEmitter {

    constructor(view, model) {
        super();

        this.view = view || new View();
        this.model = model || new Model(URL);

        this.model.on('launched', () => this.view.displayWindow());
        this.model.on('dataLoaded', data => this.view.displayMsgs(data));
        this.model.on('requestSent', (oldId, newId, notifText) => this.view.displayStatus(oldId, newId, notifText));
        this.model.on('newMessage', msg => this.view.createElem(msg, true));
        this.model.on('deleted', id => this.view.removeElem(id));

        this.view.on('readyToDel', msg_id => this.model.remove(msg_id));
        this.view.on('readyToEdit', (id, txt) => this.model.confirmEdit(id, txt));
        this.model.on('toEditElem', (id, txt) => this.view.editElem(id, txt));

        this.model.on('errorLaunch', txt => this.view.handleErrorLoad(txt));
        this.model.on('errorSent', id => this.view.handleErrorSend(id));
        this.model.on('errorRemove', id => this.view.handleErrorDelete(id));
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
        switch (e.target.getAttribute('mvc-do')) {
            case 'delete':
                this.view.onHide();
                break;
            case 'edit':
                this.view.onEdit();
                break;
            case 'send':
                let msgTxt = this.view.getText();
                if (msgTxt.trim()) {
                    this.model.onSend(msgTxt);
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