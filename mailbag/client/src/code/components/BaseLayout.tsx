// React imports.
import React, { Component } from "react";

// Library imports.
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

// App imports.
import Toolbar from "./Toolbar";
import MailboxList from "./MailboxList";
import MessageList from "./MessageList";
import ContactList from "./ContactList";
import WelcomeView from "./WelcomeView";
import ContactView from "./ContactView";
import MessageView from "./MessageView";
import { createState } from "../state";


/**
 * BaseLayout.
 */
class BaseLayout extends Component {


  /**
   * State data for the app.  This also includes all mutator functions for manipulating state.  That way, we only
   * ever have to pass this entire object down through props (not necessarily the best design in terms of data
   * encapsulation, but it does have the benefit of being quite a bit simpler).
   */
  state = createState(this);


  /**
   * Render().
   */
  render() {

    return (

     <div className="appContainer">

      <Dialog open={ this.state.pleaseWaitVisible } disableBackdropClick={ true } disableEscapeKeyDown={ true }
        transitionDuration={ 0 }>
        <DialogTitle style={{ textAlign:"center" }}>Please Wait</DialogTitle>
        <DialogContent><DialogContentText>...Contacting server...</DialogContentText></DialogContent>
      </Dialog>

       <div className="toolbar"><Toolbar state={ this.state } /></div>

       <div className="mailboxList"><MailboxList state={ this.state } /></div>

       <div className="centerArea">
        <div className="messageList"><MessageList state={ this.state } /></div>
        <div className="centerViews">
          { this.state.currentView === "welcome" && <WelcomeView /> }
          { (this.state.currentView === "message" || this.state.currentView === "compose") &&
            <MessageView state={ this.state } />
          }
          { (this.state.currentView === "contact" || this.state.currentView === "contactAdd") &&
            <ContactView state={ this.state } />
          }
        </div>
       </div>

       <div className="contactList"><ContactList state={ this.state } /></div>

     </div>
    );

  } /* End render(). */


} /* End class. */


export default BaseLayout;
