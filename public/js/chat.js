const socket = io();


const messageForm = document.querySelector('#message-form');
const messageFormInput = messageForm.querySelector('input');
const messageFormButton = messageForm.querySelector('button');
const sendLocationButton = document.querySelector('#send-location');
const messages = document.querySelector('#messages');


const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;


const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = () => {
    // Get the newest message
    const newMessage = messages.lastElementChild;

    //Get height of newest message
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    //Current Visible Height
    const visibleHeight = messages.offsetHeight;

    //How far have i scrolled from the top
    const scrollOffset = messages.scrollTop + visibleHeight;

    //Total height for the message container
    const containerHeight = messages.scrollHeight;

    //Should i auto scroll down?
    if (containerHeight - newMessageHeight <= scrollOffset)
        messages.scrollTop = messages.scrollHeight;

};

 socket.on('message', (message) => {
     const html = Mustache.render(messageTemplate, {
         username: message.username,
         message: message.text,
         createdAt: moment(message.createdAt).format('h:mm a')
     });
     messages.insertAdjacentHTML('beforeend', html);
     autoScroll();
 });


socket.on('locationMessage', (message) => {
     const html = Mustache.render(locationTemplate, {
         username: message.username,
         url: message.url,
         createdAt: moment(message.createdAt).format('h:mm a')
     });
     messages.insertAdjacentHTML('beforeend', html);
     autoScroll();
 });

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

 messageForm.addEventListener('submit', (event) => {
     event.preventDefault();

     messageFormButton.setAttribute('disabled', 'disabled');

     const message = event.target.elements.message.value;

     socket.emit('sendMessage', message, (err) => {
         messageFormButton.removeAttribute('disabled');
         messageFormInput.value = '';
         messageFormInput.focus();

         if (err) return console.log(err);

         // console.log('Message was delivered')
     })
 });

 sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Your browser does not support Geolocation');

    sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition(position => {
        const {latitude, longitude} = position.coords;
        socket.emit('sendLocation', {latitude, longitude}, () => {
            // console.log('Location shared');
            sendLocationButton.removeAttribute('disabled');
            sendLocationButton.focus();
        });
    }, error => {
        sendLocationButton.removeAttribute('disabled');
        console.log(error)
    });

 });

 socket.emit('join', {username, room}, (error) => {
        if (error){
            alert(error);
            location.href = '/'
        }
 });