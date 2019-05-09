window.onload = function() {

    // class Request {
    //     constructor(url) {
    //         this.url = url;
    //     }

    //     httpGet() {
    //         return new Promise((resolve, reject) => {
    //             axios.get(this.url)
    //                 .then(
    //                     response => {
    //                         resolve(response);
    //                         console.log("new get request");
    //                     })
    //                 .catch(error => {
    //                     reject(error);
    //                 });
    //         });
    //     }

    //     httpPost(msgId, content, name) {
    //         return new Promise((resolve, reject) => {
    //             axios.post(this.url, {
    //                     id: msgId,
    //                     text: content,
    //                     username: name
    //                 })
    //                 .then(response => {
    //                     resolve(response);
    //                     console.log("new post request");
    //                 })
    //                 .catch(error => {
    //                     reject(error);
    //                 });
    //         });
    //     }

    //     httpPut(msgId, content) {
    //         return new Promise((resolve, reject) => {
    //             axios.put(this.url + '/' + msgId, {
    //                     text: content
    //                 })
    //                 .then(
    //                     response => {
    //                         resolve(response);
    //                         console.log("new put request");
    //                     })
    //                 .catch(error => {
    //                     reject(error);
    //                 });
    //         });
    //     }

    //     httpDelete(msgId) {
    //         return new Promise((resolve, reject) => {
    //             axios.delete(this.url + '/' + msgId)
    //                 .then(
    //                     response => {
    //                         resolve(response);
    //                         console.log("new delete request");
    //                     })
    //                 .catch(error => {
    //                     reject(error);
    //                 });
    //         });
    //     }
    // };

    class Chat {
        constructor(url) {
            this.url = url;
            this.user = null;
            this.messages = [];
            this.lastMsgId = -1;
        }

        authorize() {
            this.user = localStorage.getItem('user');
            if (this.user) {
                this.user = JSON.parse(localStorage.getItem('user'));
            } else {
                this.user = prompt('Choose username:');
                if (!this.user) {
                    alert('We cannot work with you like that!');
                } else {
                    localStorage.setItem('user', JSON.stringify(this.user));
                }
            }
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

        init() {
            //проверить URL
            this.authorize();
            if (this.user) {
                this.messages = localStorage.getItem('messages');
                if (this.messages) {
                    this.messages = JSON.parse(localStorage.getItem('messages'));
                    this.displayMsgs();
                } else {
                    console.log("else");
                    axios.get(this.url)
                        .then(
                            response => {
                                console.log("get");
                                if (!$.isEmptyObject(response.data)) {
                                    response.data.reverse();
                                    localStorage.setItem('messages', JSON.stringify(response.data));
                                    this.messages = response.data;
                                    this.displayMsgs();
                                }
                            })
                        .catch(error => {
                            if (error.response) {
                                switch (error.response.status) {
                                    case 404:
                                        {
                                            alert("URL is not found");
                                            return;
                                        }
                                    case 400:
                                        {

                                        }
                                }
                            }
                        });
                }
                this.loadBtns();
                setInterval(this.checkToUpdate(), 6000);
            }
        }

        saveMsg(msg) {
            (this.createElem(msg, true))();
            this.messages.push(msg);
            this.lastMsgId = msg.id;
            localStorage.setItem('messages', JSON.stringify(this.messages));
        }

        delMsg(msg, i) {
            console.log(msg);
            msg.remove();
            this.messages.splice(i, 1);
            // this.lastMsgId = $(msg).attr("data-id");
            this.lastMsgId = this.messages[this.messages.length - 1].id;
            console.log(this.lastMsgId);
            console.log(this.messages);
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
                            response.data.reverse();

                            // обновляем id сообщений тек пользователя, кот на сервере получились другими. 
                            // если кто то например удалил последние сообщения
                            response.data.filter(x => {
                                let m = this.messages.find(el => (x.id != el.id) &&
                                    (x.username == this.user) && (x.text == el.text));
                                if (m) {
                                    let id = $(m)[$(m).length - 1].id;
                                    // let id = m[$(m).length - 1].id;
                                    this.lastMsgId = id;
                                    let idx = this.messages.findIndex(elem => elem.id == id);
                                    console.log(this.messages[idx]);
                                    this.messages[idx].id = x.id;

                                    $("[data-id = '" + id + "']").attr("data-id", x.id);
                                }
                            });

                            this.differences(response.data, this.messages);
                        });
                // .catch(error => {
                //     reject(error);
                // });
            };
        }

        createElem(data, scroll = false) {
            return () => {
                let messageForm = $("<div></div>", { 'data-id': data.id });
                let name = $("<p></p>", { 'class': 'username' });
                let text = $("<p></p>", { 'class': 'speech-bubble', 'text': data.text });

                if (data.myMessage != null) {
                    messageForm.addClass("container-right");
                    let status = $("<p></p>", { 'class': 'status' });
                    name.text(":Me");
                    text.addClass("right-bubble");
                    messageForm.append(status, text, name);
                } else {
                    messageForm.addClass("container-left");
                    name.text(data.username + ":");
                    text.addClass("left-bubble");
                    messageForm.append(name, text);
                }

                $("#chatWindow").append(messageForm);

                if (scroll) {
                    $("#chatWindow").animate({
                        scrollTop: $("#chatWindow")[0].scrollHeight
                    }, 500);
                }

                messageForm.click(this.chosenMsg);
            };
        }

        sendMsg() {
            return () => {
                let userMsg = $("#chatInput").val();

                if (this.user && userMsg.trim()) {

                    $("#chatInput").val('');

                    let elem = {
                        id: Number(this.lastMsgId) + 1,
                        text: userMsg,
                        username: this.user,
                        myMessage: true
                    };

                    // $.isEmptyObject(elem)

                    this.saveMsg(elem);

                    axios.post(this.url, elem)
                        .then(
                            response => {
                                console.log(response);
                                let status = $("[data-id = '" + elem.id + "']").children(".status");
                                status.text("delivered");
                                status.css("display", "inline-block");

                                setTimeout(() => {
                                    status.css("display", "none")
                                }, 3000);
                            })
                        .catch(error => {
                            if (error.response) {
                                let status = $("[data-id = '" + elem.id + "']").children(".status");
                                status.text("not delivered");
                                status.css({
                                    "color": "#EB0000",
                                    "display": "inline-block"
                                });

                                let idx = this.messages.findIndex(el => el.id == elem.id);
                                // this.messages.splice(idx, 1);
                                // localStorage.setItem('messages', JSON.stringify(this.messages));
                                // this.lastMsgId = this.messages[this.messages.length - 1].id;
                                // setTimeout(() => {
                                this.delMsg($(elem), idx);
                                // }, 3000);
                                // $("[data-id = '" + elem.id + "']").unbind('click', this.chosenMsg);
                                // $("[data-id = '" + elem.id + "']").click(this.errorMsg);
                            }
                        });
                }
            };
        }

        // errorMsg() {
        //     console.log("click");

        //     $(this).toggleClass("errorMsg");
        // }

        confirmEdit() {
            return () => {
                let editedMsg = $("#chatInput").val();
                $("#chatInput").val("");

                $(".chosenMsg>.speech-bubble").text(editedMsg);

                let idx = this.messages.findIndex(elem => elem.id == $(".chosenMsg").attr("data-id"));
                this.messages[idx].text = editedMsg;

                let msg = $(".chosenMsg");
                msg.removeClass("chosenMsg");

                // $(".btn").css("display", "none");
                $(".del, .edit").css("display", "none");
                $("#editMsg").css("display", "none");
                $("#newMsg").css("display", "block");

                if (editedMsg.trim()) {
                    axios.put(this.url + '/' + msg.attr("data-id"), {
                            text: editedMsg
                        })
                        .then(
                            response => {
                                console.log("new put request");

                                // let status = msg.childNodes[0];
                                // 							status.innerHTML = 'edited';
                                // 							status.style.display = 'inline-block';

                                // 							this.chosenMsgId = -1;

                                // 							setTimeout(() => {
                                // 								status.style.display = 'none';
                                // 							}, 3000);
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
                    // $(".btn").css("display", "inline-block");
                    $(".del, .edit").css("display", "inline-block");
                }
            } else {
                // $(".btn").css("display", "none");
                $(".del, .edit").css("display", "none");
            }

            $("#chatInput").val("");
        }

        removeMsg() {
            return () => {
                let msgs = $(".chosenMsg");
                $(msgs).removeClass("chosenMsg");
                // $(".btn").css("display", "none");
                $(".del, .edit").css("display", "none");
                $("#editMsg").css("display", "none");

                if (window.confirm("Are you sure?")) {
                    $(msgs).each((i, msg) => {
                        let msg_id = $(msg).attr("data-id");
                        let idx = this.messages.findIndex(el => el.id == msg_id);
                        this.delMsg(msg, idx);

                        axios.delete(this.url + '/' + msg_id)
                            .then(
                                response => {
                                    console.log("new delete request");
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

    // let app = {
    // 	request: null,
    // 	user: null,
    // 	messages: [],
    // 	mineMessagesId: [],
    // 	lastMsgId: -1,
    // 	chosenMsgId: -1,

    // 	init(url){
    // 		return () => {

    // 			this.user = localStorage.getItem('user');
    // 			if(this.user){
    // 				this.user = JSON.parse(localStorage.getItem('user'));
    // 			} else {
    // 				this.user = prompt('Choose username:');
    // 				if(!this.user){
    // 			    	alert('We cannot work with you like that!');
    // 			    	return;
    // 				} else {
    // 					localStorage.setItem('user', JSON.stringify(this.user));
    // 				}
    // 			}

    // 			this.request = new Request(url);

    // 			this.request.httpGet()
    // 				.then(
    // 					response => {
    // 						for(let i = response.data.length-1; i >= 0; i--){
    // 							(this.createElem(response.data[i]))();
    // 						}

    // 						let sendBtn = document.getElementById('newMsg');
    // 					    sendBtn.addEventListener('click', this.sendMsg());

    // 					    let delBtn = document.getElementsByClassName('btn del')[0];
    //    						delBtn.addEventListener('click', this.removeMsg());

    //    						let editBtn = document.getElementsByClassName('btn edit')[0];
    //    						editBtn.addEventListener('click', this.editMsg);

    //    						let confirmBtn = document.getElementById('editMsg');
    //    						confirmBtn.addEventListener('click', this.confirmEdit());

    // 						setInterval(this.checkToUpdate(), 5000);
    // 				});
    // 		};
    // 	},

    // 	checkToUpdate(){
    // 		return () => {
    // 			this.request.httpGet()
    // 				.then(
    // 	        		response => {
    // 	        			if(response.data.length > this.messages.length){
    // 	        				console.log("more messages");
    // 	        				for(let i = response.data.length-1; i >= 0; i--){
    // 	        					if(this.lastMsgId == response.data[i].id){
    // 	        						for(let j = i; j >= 0; j--){
    // 	        							(this.createElem(response.data[j]))();
    // 	        						}
    // 	        						break;
    // 	        					}
    // 	        				}
    // 	        			} else if(response.data.length < this.messages.length){
    // 	        				console.log("fewer messages");
    // 	        				for(let i = this.messages.length-1; i >= 0; i--){
    // 	        					for(let j = 0; j < response.data.length; j++){
    // 	        						if(this.messages[i].id != response.data[j].id && j === response.data.length-1){
    // 	        							let elem = document.getElementById('chatWindow').childNodes[i];
    //   										elem.remove();
    // 	        							this.messages.splice(i, 1);
    // 	        						} else if(this.messages[i].id == response.data[j].id){
    // 	        							break;
    // 	        						}
    // 	        					}
    // 	        				}
    // 	        			} else {
    // 	        				for(let i = response.data.length-1; i >= 0; i--){
    // 	        					let msgs = document.getElementsByClassName('container-left');
    // 	        					for(let j = 0; j < msgs.length; j++){
    // 		        					if(response.data[i].id == msgs[j].id && 
    // 		        						response.data[i].text != msgs[j].childNodes[1].innerHTML){
    // 		        					}
    // 	        					}
    // 	        				}
    // 	        			}
    // 	        	});
    // 			};
    // 	},

    // 	createElem(data){
    // 		return () => {
    // 			this.messages.push(data);

    // 	        let messageForm = document.createElement('div');
    // 			messageForm.setAttribute('id', data.id);

    // 			let name = document.createElement('p');
    // 			name.className = "username";

    // 			let text = document.createElement('p');
    // 			text.classList.add("speech-bubble");
    // 			text.innerHTML = data['text'];

    // 			if(this.mineMessagesId.length > 0){
    // 				for(let k = 0; k < this.mineMessagesId.length; k++){
    // 					if(data.id === this.mineMessagesId[k]){
    // 						messageForm.classList.add("container-right");
    // 						chatWindow.appendChild(messageForm);

    // 						let status = document.createElement('p');
    // 						status.classList.add("status");
    // 						messageForm.appendChild(status);

    // 						name.innerHTML = ":Me";
    // 						text.classList.add("right-bubble");

    // 						messageForm.appendChild(text);
    // 					    messageForm.appendChild(name);
    // 						break;
    // 					}
    // 				}
    // 			} else {
    // 				messageForm.className = "container-left";
    // 				chatWindow.appendChild(messageForm);

    // 				name.innerHTML = data['username'] + ":";
    // 				text.classList.add("left-bubble");

    // 				messageForm.appendChild(name);
    // 				messageForm.appendChild(text);
    // 			}

    // 			let y = document.getElementById("chatWindow").scrollHeight;
    // 			document.getElementById("chatWindow").scrollTo(0, y);

    // 			messageForm.addEventListener('click', this.chosenMsg);

    // 			this.lastMsgId = data.id;
    // 		};
    // 	},

    // 	findMsgById(id){
    // 	  let msgs = document.getElementById('chatWindow').childNodes;
    // 	  for(let i = 0; i < msgs.length; i++){
    // 	    if (msgs[i].getAttribute('id') == id) { return msgs[i]; }
    // 	  }
    // 	},

    // 	sendMsg(){
    // 		return () => {
    // 			let userMsg = document.getElementById('chatInput').value;
    // 			if(this.user && userMsg.trim()){

    // 				this.mineMessagesId.push(++this.lastMsgId);
    // 				document.getElementById('chatInput').value = '';

    // 				let elem = {
    // 					id: this.lastMsgId,
    // 					text: userMsg,
    // 					username: this.user
    // 				};

    // 				(this.createElem(elem))();

    // 				this.request.httpPost(elem.id, elem.text, elem.username)
    // 					.then(
    // 						() => {
    // 							// let deliveredMsg = this.findMsgById(elem.id);
    // 							let deliveredMsg = $("div").find("[data-id='${elem.id}']");
    // 							let msgs = document.getElementById('chatWindow').childNodes;
    // 							let deliveredMsg  = document.getElementsBy

    // 							let status = deliveredMsg.childNodes[0];

    // 							status.innerHTML = 'delivered';
    // 							status.style.display = 'inline-block';

    // 							setTimeout(() => {
    // 								status.style.display = 'none';
    // 							}, 3000);
    // 					});
    // 			}
    // 		};
    // 	},

    // 	confirmEdit(){
    // 		return () => {
    // 			let msg = document.getElementsByClassName('chosenMsg')[0];

    // 			let text = document.getElementById('chatInput').value;

    // 			document.getElementById('chatInput').value = "";

    // 			msg.childNodes[1].innerHTML = text;

    // 			msg.classList.remove("chosenMsg");

    // 			let btns = document.getElementsByClassName('btn');

    // 	    	for(let i = 0; i < btns.length; i++){
    // 				btns[i].style.display = 'none';
    // 			}

    // 			document.getElementById('editMsg').style.display = 'none';
    // 			document.getElementById('newMsg').style.display = 'block';

    // 	    	if(text.trim()){
    // 	    		// this.request.httpPut(msg.id, text)
    // 	    		this.request.httpPut(this.chosenMsgId, text)
    // 	    				.then(() => {
    // 	    					let status = msg.childNodes[0];
    // 							status.innerHTML = 'edited';
    // 							status.style.display = 'inline-block';

    // 							this.chosenMsgId = -1;

    // 							setTimeout(() => {
    // 								status.style.display = 'none';
    // 							}, 3000);
    // 	    				});
    // 	   		}
    //    		};
    // 	},

    // 	chosenMsg(){
    // 		let btns = document.getElementsByClassName('btn');

    // 		let btnDel = document.getElementsByClassName('btn del')[0];

    // 		if(this.classList.contains('chosenMsg')){
    // 			this.classList.remove('chosenMsg');

    // 			for(let i = 0; i < btns.length; i++){
    // 			 	btns[i].style.display = 'none';
    // 	    	}
    // 		} else {
    // 			this.classList.add("chosenMsg");

    // 			if(this.classList.contains('container-right')){
    // 				for(let i = 0; i < btns.length; i++){
    // 			    		btns[i].style.display = 'inline-block';
    // 			   	}
    // 			} else {
    // 				btnDel.style.display = 'inline-block';
    // 			}
    // 		}	

    // 		let msgs = document.getElementById('chatWindow').childNodes;

    // 		for(let i = 0; i < msgs.length; i++){
    // 			if(msgs[i].classList.contains('chosenMsg') && msgs[i].getAttribute('id') != this.getAttribute('id')){
    // 				msgs[i].classList.remove('chosenMsg');
    // 			}
    // 		}

    // 		if(document.getElementById('chatInput').value){
    // 			document.getElementById('chatInput').value = "";
    // 		}

    // 		(app.changeId(this))();
    // 	},

    // 	changeId(msg){
    // 		return () => {
    // 		    if(this.chosenMsgId == -1){
    // 			    this.chosenMsgId = msg.getAttribute('id');
    // 			} else {
    // 				this.chosenMsgId = -1;
    // 			}
    // 		};
    // 	},

    // 	removeMsg(){
    // 		return () => {
    // 			let msg = document.getElementsByClassName('chosenMsg')[0];
    // 			if(msg){
    // 				msg.classList.remove("chosenMsg");

    // 				let btns = document.getElementsByClassName('btn');

    // 				for(let i = 0; i < btns.length; i++){
    // 					btns[i].style.display = 'none';
    // 				}

    // 				// this.request.httpDelete(msg.id);
    // 				this.request.httpDelete(this.chosenMsgId)
    // 					.then(
    // 						() => {
    // 							this.chosenMsgId = -1;
    // 						});
    // 			}
    // 		};
    // 	},

    // 	editMsg(){
    // 		document.getElementById('newMsg').style.display = 'none';
    // 		document.getElementById('editMsg').style.display = 'block';

    // 		let msgToEdit = document.getElementsByClassName('chosenMsg')[0];
    // 		let input  = document.getElementById('chatInput');
    // 		input.value = msgToEdit.childNodes[1].innerHTML;

    // 		input.focus();
    // 	}
    // };

    const URL = 'http://localhost:8080/api/chat/message';
    const chat = new Chat(URL);
    chat.init();
    // let chat = app.init(URL);
    // chat();
};