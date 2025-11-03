Material UI
To simplify the UI building process we’ll use Material UI — an open-source React component library that implements Google’s Material Design. The component library includes a comprehensive collection of prebuilt components that work out of the box.

To add Material UI to your project run:
 npm install @mui/material @emotion/react @emotion/styled

 Material UI uses Roboto font by default. Let’s install it with:

$ npm install @fontsource/roboto
Next, navigate to index.js and add the following imports:

// src/index.js

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


import React, {useEffect, useState} from "react";
import {Box, Button, Card, CardContent, Grid, TextField} from "@mui/material";

function App() {

  const messagesListRef = React.createRef();
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = (content) => {
    // add the message to the state
    setMessages([
      ...messages,
      {
        content: content,
        isCustomer: true,
      }
    ]);

    // TODO: post the request to Back4app
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    sendMessage(messageInput);
    setMessageInput("");
  }

  return (
    <Grid
      container
      direction="row"
      justifyContent="center"
      alignItems="center"
    >
      <Card sx={{maxWidth: 420}}>
        <CardContent>
          <Box
            ref={messagesListRef}
            sx={{
              height: 420,
              overflow: "scroll",
              overflowX: "hidden",
            }}
          >
            <Box sx={{m: 1, mr: 2}}>
              {/* TODO: messages will be displayed here */}
            </Box>
          </Box>
          <Box
            component="form"
            sx={{
              mt: 2,
              display: "flex",
              flexFlow: "row",
              gap: 1,
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              type="submit"
            >
              Send
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}

export default App;
We defined a simple form with a message input that calls handleSubmit() on submit.
We used React useState() hook to handle state.
messageInput is the current message
messages is the list of messages
handleSubmit() clears the message input and calls sendMessage() which appends the message to the state.



To adapt:
import React, {useEffect, useState} from "react";
import {Box, Button, Card, CardContent, Grid, TextField} from "@mui/material";

function App() {

  const messagesListRef = React.createRef();
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = (content) => {
    // add the message to the state
    setMessages([
      ...messages,
      {
        content: content,
        isCustomer: true,
      }
    ]);

    // TODO: post the request to Back4app
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    sendMessage(messageInput);
    setMessageInput("");
  }

  return (
    <Grid
      container
      direction="row"
      justifyContent="center"
      alignItems="center"
    >
      <Card sx={{maxWidth: 420}}>
        <CardContent>
          <Box
            ref={messagesListRef}
            sx={{
              height: 420,
              overflow: "scroll",
              overflowX: "hidden",
            }}
          >
            <Box sx={{m: 1, mr: 2}}>
              {/* TODO: messages will be displayed here */}
            </Box>
          </Box>
          <Box
            component="form"
            sx={{
              mt: 2,
              display: "flex",
              flexFlow: "row",
              gap: 1,
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              type="submit"
            >
              Send
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}

export default App;
We defined a simple form with a message input that calls handleSubmit() on submit.
We used React useState() hook to handle state.
messageInput is the current message
messages is the list of messages
handleSubmit() clears the message input and calls sendMessage() which appends the message to the state.

Moving along, let’s create a component for displaying the messages.

Create a new folder named components within the src folder and within that folder create a new file named Message.js with the following contents:

// src/components/Message.js

import avatar from "../assets/bot.png";
import {Avatar, Box, Chip, Typography} from "@mui/material";

export default function Message(props) {
  return (
    <div>
      <Box
        sx={{
          my: 2,
          display: "flex",
          flexFlow: "row",
          justifyContent: props.isCustomer ? "right" : "left",
        }}
      >
        {!props.isCustomer && (
          <Avatar sx={{mr: 1, bgcolor: "primary.main"}}>
            <img src={avatar} alt="Chatbot avatar" width={32}/>
          </Avatar>
        )}
        <Box>
          <Typography gutterBottom variant="body2" component="div" sx={{mt: 1.5}}>
            {props.content}
          </Typography>
          {props.image && (
            <img src={props.image} alt="Bot response" style={{width: "100%"}}/>
          )}
          {!props.isCustomer && props.choices && (
            <Box sx={{mt: 1}}>
              {props.choices.map((choice, index) => (
                <Chip
                  key={index}
                  label={choice}
                  onClick={() => props.handleChoice(choice)}
                  sx={{mr: 0.5, mb: 0.5}}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </div>
  );
}
This component takes a few arbitrary inputs (props) and then displays a message.

content — message content
image — message image
isCustomer — true if the message is sent by the user
choices — choices the user can pick from
handleChoice — the function that is called when a choice is selected
Next, create a folder named assets within the src folder and put in an image you’d like your chatbot to use as an avatar. Feel free to use this one.

Make sure to name the avatar image bot.png or change the import in Message.js.

Lastly, to utilize the newly created component replace the TODO in App.js like so:

// App.js

{messages.map((message, index) => (
  <Message
    key={index}
    content={message.content}
    image={message.image}
    isCustomer={message.isCustomer}
    choices={message.choices}
    handleChoice={sendMessage}
  />
))}
Don’t forget to add the import at the top of the file:

