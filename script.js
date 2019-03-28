// const axios = require('axios');

// function listener(event) {
//   if (event.origin != 'http://javascript.ru') {
//     return;
//   }

//   alert( "получено: " + event.data );
// }

// if (window.addEventListener) {
//   window.addEventListener("message", listener);
// } 

const url = 'http://localhost:8080/api/chat/message';

let app = {
	// data: {
		name: '', 
		msg: '',
	// }, 
	// methods: {
		sendMsg: function() {
    		return () => {

				if(this.data.msg){
					axios.post(url, {
						user: this.data.name,
						text: this.data.msg
					})

					if(response.status===200){
			            console.log('success');
			            this.data.msg= '';
			        }
				}
			}
		},

		addMessages: function(message){
			return () => {
				let messages = document.getElementById("messages");

				let name = document.createElement('h2');
				let text = document.createElement('p');

				messages.appendChild(name, text);
			}
		},

		inputHandler: function(e){
	        if(e.keyCode===13){
	            this.sendMsg();
	        }
    	},

    	clickHandler: function(){
    		return () => { arguments[0].addEventListener('click', () => {
	    			let userName = document.getElementById('name').value;
					let userMsg = document.getElementById('msg').value;
					if(userName.trim() && userMsg.trim()){
						console.log('click');
						// sendMsg()
					} else return;
    			})
    		}
    	}


	// }
};


// let handle = app.clickHandler.bind(app);
let elem = document.getElementById('send');
let func = app.clickHandler(elem);
func();

// let message = null;

// function sendMsg(){
// 	if(this.message){
// 		axios.post(url, {
// 			user: 'user',
// 			text: this.message
// 		})

// 		if(response.status===200){
//                 console.log('success')
//                 app.singleMsgs = response.data;
//                 app.msgFrom= '';
//             }
// 	}
// }

let messages = new Array();


// axios.get(url)
//   .then(response => {
//   	messages.push(response.data[0])
//   	console.log(response.data[0]);
// });


// let sendBtn = document.getElementById('send');
// sendBtn.addEventListener('click', function(){
// 	let app.data.name = ;
// });


