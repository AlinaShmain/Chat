window.onload = function() {

	class Request {
		constructor(url){
			this.url = url;
		}

		httpGet(){
			return new Promise( (resolve, reject) => {
				axios.get(this.url)
					.then(
						response => {
							resolve(response);
							console.log("new get request");
					})
					.catch(error => {
						reject(error);
					});
			});
		}

		httpPost(msgId, content, name){
	    	return new Promise( (resolve, reject) => {
				axios.post(this.url, {
					id: msgId,
					text: content,
					username: name
				})
					.then(response => {
						resolve(response);
						console.log("new post request");
					})
					.catch(error => {
						reject(error);
					});
			});
    	}

		httpPut(msgId, content){
			return new Promise( (resolve, reject) => {
				axios.put(this.url + '/' + msgId, {
					text: content
				})
					.then(
						response => {
							resolve(response);
							console.log("new put request");
					})
					.catch(error => {
						reject(error);
					});
			});
		}

		httpDelete(msgId){
			return new Promise( (resolve, reject) => {
				axios.delete(this.url + '/' + msgId)
					.then(
						response => {
							resolve(response);
							console.log("new delete request");
					})
					.catch(error => {
						reject(error);
					});
			});
		}
	};

	let app = {
		request: null,
		user: null,
		messages: [],
		mineMessagesId: [],
		lastMsgId: -1,

		init(url){
			return () => {

				this.user = localStorage.getItem('user');
				if(this.user){
					this.user = JSON.parse(localStorage.getItem('user'));
				} else {
					this.user = prompt('Choose username:');
					if(!this.user){
				    	alert('We cannot work with you like that!');
				    	return;
					} else {
						localStorage.setItem('user', JSON.stringify(this.user));
					}
				}

				this.request = new Request(url);

				this.request.httpGet()
					.then(
						response => {
							for(let i = response.data.length-1; i >= 0; i--){
								(this.createElem(response.data[i]))();
							}

							let sendBtn = document.getElementById('newMsg');
						    sendBtn.addEventListener('click', this.sendMsg());

						    let delBtn = document.getElementsByClassName('btn del')[0];
    						delBtn.addEventListener('click', this.removeMsg());

    						let editBtn = document.getElementsByClassName('btn edit')[0];
    						editBtn.addEventListener('click', this.editMsg);

    						let confirmBtn = document.getElementById('editMsg');
    						confirmBtn.addEventListener('click', this.confirmEdit());

							setInterval(this.checkToUpdate(), 5000);
					});
			};
		},

		checkToUpdate(){
			return () => {
				this.request.httpGet()
					.then(
		        		response => {
		        			if(response.data.length > this.messages.length){
		        				console.log("more messages");
		        				for(let i = response.data.length-1; i >= 0; i--){
		        					if(this.lastMsgId == response.data[i].id){
		        						for(let j = i; j >= 0; j--){
		        							(this.createElem(response.data[j]))();
		        						}
		        						break;
		        					}
		        				}
		        			} else if(response.data.length < this.messages.length){
		        				console.log("fewer messages");
		        				for(let i = this.messages.length-1; i >= 0; i--){
		        					for(let j = 0; j < response.data.length; j++){
		        						if(this.messages[i].id != response.data[j].id && j === response.data.length-1){
		        							let elem = document.getElementById('chatWindow').childNodes[i];
	  										elem.remove();
		        							this.messages.splice(i, 1);
		        						} else if(this.messages[i].id == response.data[j].id){
		        							break;
		        						}
		        					}
		        				}
		        			} else {
		        				for(let i = response.data.length-1; i >= 0; i--){
		        					let msgs = document.getElementsByClassName('container-left');
		        					for(let j = 0; j < msgs.length; j++){
			        					if(response.data[i].id == msgs[j].id && 
			        						response.data[i].text != msgs[j].childNodes[1].innerHTML){
			        					}
		        					}
		        				}
		        			}
		        	});
				};
		},

		createElem(data){
			return () => {
				this.messages.push(data);

		        let messageForm = document.createElement('div');
				messageForm.setAttribute('id', data.id);

				let name = document.createElement('p');
				name.className = "username";

				let text = document.createElement('p');
				text.classList.add("speech-bubble");
				text.innerHTML = data['text'];

				if(this.mineMessagesId.length > 0){
					for(let k = 0; k < this.mineMessagesId.length; k++){
						if(data.id === this.mineMessagesId[k]){
							messageForm.classList.add("container-right");
							chatWindow.appendChild(messageForm);

							let status = document.createElement('p');
							status.classList.add("status");
							messageForm.appendChild(status);

							name.innerHTML = ":Me";
							text.classList.add("right-bubble");

							messageForm.appendChild(text);
						    messageForm.appendChild(name);
							break;
						}
					}
				} else {
					messageForm.className = "container-left";
					chatWindow.appendChild(messageForm);

					name.innerHTML = data['username'] + ":";
					text.classList.add("left-bubble");

					messageForm.appendChild(name);
					messageForm.appendChild(text);
				}

				let y = document.getElementById("chatWindow").scrollHeight;
				document.getElementById("chatWindow").scrollTo(0, y);

				messageForm.addEventListener('click', this.chosenMsg);

				this.lastMsgId = data.id;
			};
		},

		findMsgById(id){
		  let msgs = document.getElementById('chatWindow').childNodes;
		  for(let i = 0; i < msgs.length; i++){
		    if (msgs[i].getAttribute('id') == id) { return msgs[i]; }
		  }
		},

		sendMsg(){
			return () => {
				let userMsg = document.getElementById('chatInput').value;
				if(this.user && userMsg.trim()){

					this.mineMessagesId.push(++this.lastMsgId);
					document.getElementById('chatInput').value = '';

					let elem = {
						id: this.lastMsgId,
						text: userMsg,
						username: this.user
					};

					(this.createElem(elem))();

					this.request.httpPost(elem.id, elem.text, elem.username)
						.then(
							() => {
								let deliveredMsg = this.findMsgById(elem.id);

								let status = deliveredMsg.childNodes[0];

								status.innerHTML = 'delivered';
								status.style.display = 'inline-block';

								setTimeout(() => {
									status.style.display = 'none';
								}, 3000);
						});
				}
			};
		},

		confirmEdit(){
			return () => {
				let msg = document.getElementsByClassName('chosenMsg')[0];

				let text = document.getElementById('chatInput').value;

				document.getElementById('chatInput').value = "";

				msg.childNodes[1].innerHTML = text;

				msg.classList.remove("chosenMsg");

				let btns = document.getElementsByClassName('btn');

		    	for(let i = 0; i < btns.length; i++){
					btns[i].style.display = 'none';
				}

				document.getElementById('editMsg').style.display = 'none';
				document.getElementById('newMsg').style.display = 'block';

		    	if(text.trim()){
		    		this.request.httpPut(msg.id, text)
		    				.then(() => {
		    					let status = msg.childNodes[0];
								status.innerHTML = 'edited';
								status.style.display = 'inline-block';

								setTimeout(() => {
									status.style.display = 'none';
								}, 3000);
		    				});
		   		}
	   		};
		},

		chosenMsg(){
			let btns = document.getElementsByClassName('btn');

			let btnDel = document.getElementsByClassName('btn del')[0];

			if(this.classList.contains('chosenMsg')){
				this.classList.remove('chosenMsg');

				for(let i = 0; i < btns.length; i++){
				 	btns[i].style.display = 'none';
		    	}
			} else {
				this.classList.add("chosenMsg");

				if(this.classList.contains('container-right')){
					for(let i = 0; i < btns.length; i++){
				    		btns[i].style.display = 'inline-block';
				   	}
				} else {
					btnDel.style.display = 'inline-block';
				}
			}	

			let msgs = document.getElementById('chatWindow').childNodes;

			for(let i = 0; i < msgs.length; i++){
				if(msgs[i].classList.contains('chosenMsg') && msgs[i].getAttribute('id') != this.getAttribute('id')){
					msgs[i].classList.remove('chosenMsg');
				}
			}

			if(document.getElementById('chatInput').value){
				document.getElementById('chatInput').value = "";
			}
		},

		removeMsg(){
			return () => {
				let msg = document.getElementsByClassName('chosenMsg')[0];
				if(msg){
					msg.classList.remove("chosenMsg");

					let btns = document.getElementsByClassName('btn');

					for(let i = 0; i < btns.length; i++){
						btns[i].style.display = 'none';
					}

					this.request.httpDelete(msg.id);
				}
			};
		},

		editMsg(){
			document.getElementById('newMsg').style.display = 'none';
			document.getElementById('editMsg').style.display = 'block';

			let msgToEdit = document.getElementsByClassName('chosenMsg')[0];
			let input  = document.getElementById('chatInput');
			input.value = msgToEdit.childNodes[1].innerHTML;

			input.focus();
		}
	};

	const URL = 'http://localhost:8080/api/chat/message';
	let chat = app.init(URL);
	chat();
};