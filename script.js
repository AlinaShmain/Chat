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

let app = {
	data: {
		name: '', 
		msg: '', 
	methods: {

	}
}

const url = 'http://localhost:8080/api/chat/message';

let message = null;

function sendMsg(){
	if(this.message){
		axios.post(url, {
			user: 'user',
			text: this.message
		})

		if(response.status===200){
                console.log('success')
               // console.log('save Successfully'+ data);
                app.singleMsgs = response.data;
                app.msgFrom= '';

              // /  app.conID = response.data[0].conversation_id;
            }
	}
}

let messages = new Array();


axios.get(url)
  .then(response => {
  	// let data = JSON.parse(response.data[0]);
  	messages.push(response.data[0])
  	console.log(response.data[0]);
});


// axios.get(url)
//   .then(response => console.log(response));

