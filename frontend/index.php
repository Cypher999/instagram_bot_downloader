<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Socket.IO Example</title>
    <style>
        body{
            font-family: Colibri;
        }
        img{
            width:300px;
            height:300px;
            object-fit: cover;
        }
    </style>
</head>
<body>
    <h1>Depati GPT</h1>
    <p>With GPT 4o Models</p>
    <div class="answer"></div>
    <div class="loading" style="display:none">Loading</div>
    <input type="text"/>
    <input type="button" class="send" value="send"/>
</body>
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>

    <script>
        const socket = io('http://127.0.0.1:3000'); // Replace with your server URL
        const answer=document.querySelector('.answer');
        let answerElement="";
        // Log when connected
        socket.on('connect', () => {
            console.log('Connected to the server');
        });
        socket.on('ack', (data) => {
            answerElement.innerHTML=data;            
        });
        socket.on('done',()=>{
            console.log('done answer');
            document.querySelector('.loading').style.display="none";
            document.querySelector('.send').disabled=false;
            done_answer=true;
        })
        // Log when disconnected
        socket.on('disconnect', () => {
            console.log('Disconnected from the server');
        });
        document.querySelector('.send').addEventListener('click',function(){
            document.querySelector('.send').disabled=true;
            document.querySelector('.loading').style.display="block";
            answerElement=document.createElement('div');                
            answerElement.style['margin-bottom']="10px";
            answerElement.style['border-top']="1px solid black";
            answerElement.style['border-bottom']="1px solid black";                
            answer.appendChild(answerElement);
            socket.emit('send',document.querySelector('input').value);
            document.querySelector('input').value="";
        })
    </script>
</html>
