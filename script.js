let currentChat = 0;

document.addEventListener('DOMContentLoaded', (event) => {

  let messagesContainer = document.querySelector('.messages');
  let userInput = document.getElementById('input-text-field');
  let submitButton = document.getElementById('input-submit-button'); // assuming your submit button has a class of 'submit-button'
  let recentChats = document.querySelector('.recent-chats');
  let newChatBox = document.getElementById('new-chat-box');

  //Contruct Every Saved Chat on first load
  window.electron.send('requestAllChats');
  window.electron.on('responseAllChats', (event, response) => {
    let parsedJSON = JSON.parse(response);
    if(parsedJSON == null) {
      return;
    }

    for(let ChatId in parsedJSON) {
      let newChat = document.createElement('div');
      newChat.classList.add('recent-chat-box');
      let chatText = document.createElement('p');
      chatText.style.pointerEvents = 'none';
      if(parsedJSON[ChatId].Initial === ""){ // If no name is set
        chatText.innerHTML = "New Chat";
        newChat.setAttribute('no-name', 'true');
      } else {
        chatText.innerHTML = parsedJSON[ChatId].Initial;
      }
      newChat.appendChild(chatText);
      newChat.id = ChatId.toString();

      newChat.addEventListener('click', (event) => {
        if (event.target === chatText) {
          return;
        }

        RemoveLastActive();
        MakeMeActive(event.target); // Make it active
        let chatId = event.target.id;
        currentChat = parseInt(chatId);
        WipeAllMessages();
        getChatHistory(currentChat).then((response) => {
          if(response != null) {
            let chatHistoryObject = JSON.parse(response);

            chatHistoryObject.forEach(historyObjet => {
              let newMessage = document.createElement('div');
              let messageText = document.createElement('div');
              messageText.classList.add('message-text');
              messageText.innerHTML = historyObjet.text;
              newMessage.appendChild(messageText);
              messagesContainer.appendChild(newMessage);

              if(historyObjet.type == "User"){
                newMessage.classList.add('message', 'user'); // Pos Right
              } else {
                newMessage.classList.add('message', 'ai'); // Pos Left
              }
            });
          }
        });
      });
      recentChats.appendChild(newChat);
    }
  })

  // Capture the form submission event
  let form = document.getElementById('chatForm');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const userInput = document.querySelector('.user-input');
    const mensagemUsuario = userInput.value;

    // Make a new chat if there is no chat on first message
    if(currentChat === 0){ 
      // Make a new Chat
      currentChat = FindNextAvailableId();
      let newChat = document.createElement('div');
      newChat.classList.add('recent-chat-box');
      let chatText = document.createElement('p');
      chatText.style.pointerEvents = 'none';
      chatText.innerHTML = mensagemUsuario;
      newChat.appendChild(chatText);
      newChat.id = currentChat.toString();
      newChat.addEventListener('click', (event) => {
        if (event.target === chatText) {
          return;
        }

        RemoveLastActive();
        MakeMeActive(event.target); // Make it active
        let chatId = event.target.id;
        currentChat = parseInt(chatId);
        WipeAllMessages();
        getChatHistory(currentChat).then((response) => {
          if(response != null) {
            let chatHistoryObject = JSON.parse(response);

            chatHistoryObject.forEach(historyObjet => {
              let newMessage = document.createElement('div');
              let messageText = document.createElement('div');
              messageText.classList.add('message-text');
              messageText.innerHTML = historyObjet.text;
              newMessage.appendChild(messageText);
              messagesContainer.appendChild(newMessage);

              if(historyObjet.type == "User"){
                newMessage.classList.add('message', 'user'); // Pos Right
              } else {
                newMessage.classList.add('message', 'ai'); // Pos Left
              }
            });
          }
        });
      });
      recentChats.appendChild(newChat);
    }

    // Set Chat Name to first Message after it is sent
    let currChatElement = GetCurrentChatFromId(currentChat.toString());
    if(currChatElement != undefined){
      if(currChatElement.getAttribute('no-name') === 'true'){
        currChatElement.children[0].innerHTML = mensagemUsuario;
        currChatElement.setAttribute('no-name', 'false');
      }
    }

    // Disable the input field and the submit button
    userInput.disabled = true;
    submitButton.disabled = true;

    // Show users' message on the interface
    let userMessage = document.createElement('div');
    userMessage.classList.add('message', 'user');
    let messageText = document.createElement('div');
    messageText.classList.add('message-text');
    messageText.innerHTML = mensagemUsuario;
    userMessage.appendChild(messageText);
    messagesContainer.appendChild(userMessage);

    // Send message to main process
    let SendObject = {
      chatId: currentChat,
      message: mensagemUsuario
    }
    window.electron.send('requestAIResponse', JSON.stringify(SendObject)); // Talk to AI - Send question + current Chat ID

    userInput.value = '';
  });

  // Listen to answer from main process
  window.electron.on('responseAI', (event, response) => {
    
    let RespObject = JSON.parse(response);

    if(RespObject.chatId != currentChat){
      return;
    }

    let AIMessage = document.createElement('div');
    AIMessage.classList.add('message', 'ai');
    let AImessageText = document.createElement('div');
    AImessageText.classList.add('message-text');
    AImessageText.innerHTML = RespObject.response;
    AIMessage.appendChild(AImessageText);
    messagesContainer.appendChild(AIMessage);

    // Re-enable the input field and the submit button
    userInput.disabled = false;
    submitButton.disabled = false;
  });

  // Make a new chat when New Chat is clicked
  newChatBox.addEventListener('click', (event) => {
    currentChat = FindNextAvailableId();
    WipeAllMessages();
    let newChat = document.createElement('div');
    RemoveLastActive();
    newChat.classList.add('recent-chat-box');
    let chatText = document.createElement('p');
    chatText.style.pointerEvents = 'none';
    chatText.innerHTML = "New Chat";
    newChat.appendChild(chatText);
    newChat.id = currentChat.toString();
    newChat.setAttribute('no-name', 'true');
    newChat.addEventListener('click', (event) => {
      if (event.target === chatText) {
        return;
      }

      RemoveLastActive();
      MakeMeActive(event.target); // Make it active
      let chatId = event.target.id;
      currentChat = parseInt(chatId);;
      WipeAllMessages();

      getChatHistory(currentChat).then((response) => {
        if(response != null) {
          let chatHistoryObject = JSON.parse(response);

          chatHistoryObject.forEach(historyObjet => {
            let newMessage = document.createElement('div');
            let messageText = document.createElement('div');
            messageText.classList.add('message-text');
            messageText.innerHTML = historyObjet.text;
            newMessage.appendChild(messageText);
            messagesContainer.appendChild(newMessage);

            if(historyObjet.type == "User"){
              newMessage.classList.add('message', 'user'); // Pos Right
            } else {
              newMessage.classList.add('message', 'ai'); // Pos Left
            }
          });
        }
      });
    });
    recentChats.appendChild(newChat);
  });

  function GetCurrentChatFromId(id){
    return Array.from(recentChats.children).find(element => element.id === id);
  }

  function WipeAllMessages() {
    while (messagesContainer.firstChild) { // Clear the chat
      messagesContainer.removeChild(messagesContainer.firstChild);
    }
  }

  function FindNextAvailableId() {
    let id = 1;
    let found = false;
    while (!found) {
      if (GetCurrentChatFromId(id.toString()) === undefined) {
        found = true;
      } else {
        id += 1;
      }
    }
    return id;
  }

  function RemoveLastActive() {
    if(currentChat === 0){
      return;
    }

    let currChatElement = GetCurrentChatFromId(currentChat.toString());
    if(currChatElement != undefined){
      if(currChatElement.classList.contains('recent-chat-box-active')){
        currChatElement.classList.remove('recent-chat-box-active');
      }
    }
  }

  function MakeMeActive(element) {
    element.classList.add('recent-chat-box-active');
  }

  async function getChatHistory(chatId) {
    return new Promise((resolve) => {
      window.electron.send('requestChatHistory', chatId);
      window.electron.on('responseChatHistory', (event, response) => {
        resolve(response)
      });
    });
  }
});