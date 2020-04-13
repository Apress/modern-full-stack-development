// App imports.
import * as Contacts from "./Contacts";
import { config } from "./config";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";


/**
 * This function must be called once and only once from BaseLayout.
 */
export function createState(inParentComponent) {

  return {


    // Flag: Is the please wait dialog visible?
    pleaseWaitVisible : false,

    // List of contacts.
    contacts : [ ],

    // List of mailboxes.
    mailboxes : [ ],

    // List of messages in the current mailbox.
    messages : [ ],

    // The view that is currently showing ("welcome", "message", "compose", "contact" or "contactAdd").
    currentView : "welcome",

    // The currently selected mailbox, if any.
    currentMailbox : null,

    // The details of the message currently being viewed or composed, if any.
    messageID : null,
    messageDate : null,
    messageFrom : null,
    messageTo : null,
    messageSubject : null,
    messageBody : null,

    // The details of the contact currently being viewed or added, if any.
    contactID : null,
    contactName : null,
    contactEmail : null,


    // ------------------------------------------------------------------------------------------------
    // ------------------------------------ View Switch functions -------------------------------------
    // ------------------------------------------------------------------------------------------------


    /**
     * Shows or hides the please wait dialog during server calls.
     *
     * @param inVisible True to show the dialog, false to hide it.
     */
    showHidePleaseWait : function(inVisible: boolean): void {

      this.setState({ pleaseWaitVisible : inVisible });

    }.bind(inParentComponent), /* End showHidePleaseWait(). */


    /**
     * Show ContactView in view mode.
     *
     * @param inID    The ID of the contact to show.
     * @param inName  The name of the contact to show.
     * @oaram inEmail The Email address of the contact to show.
     */
    showContact : function(inID: string, inName: string, inEmail: string): void {

      console.log("state.showContact()", inID, inName, inEmail);

      this.setState({ currentView : "contact", contactID : inID, contactName : inName, contactEmail : inEmail });

    }.bind(inParentComponent), /* End showContact(). */


    /**
     * Show ContactView in add mode.
     */
    showAddContact : function(): void {

      console.log("state.showAddContact()");

      this.setState({ currentView : "contactAdd", contactID : null, contactName : "", contactEmail : "" });

    }.bind(inParentComponent), /* End showAddContact(). */


    /**
     * Show MessageView in view mode.
     *
     * @param inMessage The message object that was clicked.
     */
    showMessage : async function(inMessage: IMAP.IMessage): Promise<void> {

      console.log("state.showMessage()", inMessage);

      // Get the message's body.
      this.state.showHidePleaseWait(true);
      const imapWorker: IMAP.Worker = new IMAP.Worker();
      const mb: String = await imapWorker.getMessageBody(inMessage.id, this.state.currentMailbox);
      this.state.showHidePleaseWait(false);

      // Update state.
      this.setState({ currentView : "message",
        messageID : inMessage.id, messageDate : inMessage.date, messageFrom : inMessage.from,
        messageTo : "", messageSubject : inMessage.subject, messageBody : mb
      });

    }.bind(inParentComponent), /* End showMessage(). */


    /**
     * Show MessageView in compose mode.
     *
     * @param inType Pass "new" if this is a new message, "reply" if it's a reply to the message currently being
     *                    viewed, and "contact" if it's a message to the contact currently being viewed.
     */
    showComposeMessage : function(inType: string): void {

      console.log("state.showComposeMessage()");

      switch (inType) {

        case "new":
          this.setState({ currentView : "compose",
            messageTo : "", messageSubject : "", messageBody : "",
            messageFrom : config.userEmail
          });
        break;

        case "reply":
          this.setState({ currentView : "compose",
            messageTo : this.state.messageFrom, messageSubject : `Re: ${this.state.messageSubject}`,
            messageBody : `\n\n---- Original Message ----\n\n${this.state.messageBody}`, messageFrom : config.userEmail
          });
        break;

        case "contact":
          this.setState({ currentView : "compose",
            messageTo : this.state.contactEmail, messageSubject : "", messageBody : "",
            messageFrom : config.userEmail
          });
        break;

      }

    }.bind(inParentComponent), /* End showComposeMessage(). */


    // ------------------------------------------------------------------------------------------------
    // ---------------------------------------- List functions ----------------------------------------
    // ------------------------------------------------------------------------------------------------


    /**
     * Add a mailbox to the list of mailboxes.
     *
     * @param inMailbox A mailbox descriptor object.
     */
    addMailboxToList : function(inMailbox: IMAP.IMailbox): void {

      console.log("state.addMailboxToList()", inMailbox);

      // Copy list.
      const cl: IMAP.IMailbox[] = this.state.mailboxes.slice(0);

      // Add new element.
      cl.push(inMailbox);

      // Update list in state.
      this.setState({ mailboxes : cl });

    }.bind(inParentComponent), /* End addMailboxToList(). */


    /**
     * Add a contact to the list of contacts.
     *
     * @param inContact A contact descriptor object.
     */
    addContactToList : function(inContact: Contacts.IContact): void {

      console.log("state.addContactToList()", inContact);

      // Copy list.
      const cl = this.state.contacts.slice(0);

      // Add new element.
      cl.push({ _id : inContact._id, name : inContact.name, email : inContact.email });

      // Update list in state.
      this.setState({ contacts : cl });

    }.bind(inParentComponent), /* End addContactToList(). */


    /**
     * Add a message to the list of messages in the current mailbox.
     *
     * @param inMessage A message descriptor object.
     */
    addMessageToList : function(inMessage: IMAP.IMessage): void {

      console.log("state.addMessageToList()", inMessage);

      // Copy list.
      const cl = this.state.messages.slice(0);

      // Add new element.
      cl.push({ id : inMessage.id, date : inMessage.date, from : inMessage.from, subject : inMessage.subject });

      // Update list in state.
      this.setState({ messages : cl });

    }.bind(inParentComponent), /* End addMessageToList(). */


    /**
     * Clear the list of messages currently displayed.
     */
    clearMessages : function(): void {

      console.log("state.clearMessages()");

      this.setState({ messages : [ ] });

    }.bind(inParentComponent), /* End clearMessages(). */


    // ------------------------------------------------------------------------------------------------
    // ------------------------------------ Event Handler functions -----------------------------------
    // ------------------------------------------------------------------------------------------------


    /**
     * Set the current mailbox.
     *
     * @param inPath The path of the current mailbox.
     */
    setCurrentMailbox : function(inPath: String): void {

      console.log("state.setCurrentMailbox()", inPath);

      // Update state.
      this.setState({ currentView : "welcome", currentMailbox : inPath });

      // Now go get the list of messages for the mailbox.
      this.state.getMessages(inPath);

    }.bind(inParentComponent), /* End setCurrentMailbox(). */


    /**
     * Get a list of messages in the currently selected mailbox, if any.
     *
     * @param inPath The path to the mailbox to get messages for.  Note that because this method is called when the
     *               current mailbox is set, we can't count on state having been updated by the time this is called,
     *               hence why the mailbox is passed in.  This avoids the problem with setState() being asynchronous.
     */
    getMessages : async function(inPath: string): Promise<void> {

      console.log("state.getMessages()");

      this.state.showHidePleaseWait(true);
      const imapWorker: IMAP.Worker = new IMAP.Worker();
      const messages: IMAP.IMessage[] = await imapWorker.listMessages(inPath);
      this.state.showHidePleaseWait(false);

      this.state.clearMessages();
      messages.forEach((inMessage: IMAP.IMessage) => {
        this.state.addMessageToList(inMessage);
      });

    }.bind(inParentComponent), /* End getMessages(). */


    /**
     * Fires any time the user types in an editable field.
     *
     * @param inEvent The event object generated by the keypress.
     */
    fieldChangeHandler : function(inEvent: any): void {

      console.log("state.fieldChangeHandler()", inEvent.target.id, inEvent.target.value);

      // Enforce max length for contact name.
      if (inEvent.target.id === "contactName" && inEvent.target.value.length > 16) { return; }

      this.setState({ [inEvent.target.id] : inEvent.target.value });

    }.bind(inParentComponent), /* End fieldChangeHandler(). */


    /**
     * Save contact.
     */
    saveContact : async function(): Promise<void> {

      console.log("state.saveContact()", this.state.contactID, this.state.contactName, this.state.contactEmail);

      // Copy list.
      const cl = this.state.contacts.slice(0);

      // Save to server.
      this.state.showHidePleaseWait(true);
      const contactsWorker: Contacts.Worker = new Contacts.Worker();
      const contact: Contacts.IContact =
        await contactsWorker.addContact({ name : this.state.contactName, email : this.state.contactEmail });
      this.state.showHidePleaseWait(false);

      // Add to list.
      cl.push(contact);

      // Update state.
      this.setState({ contacts : cl, contactID : null, contactName : "", contactEmail : "" });

    }.bind(inParentComponent), /* End saveContact(). */


    /**
     * Delete the currently viewed contact.
     */
    deleteContact : async function(): Promise<void> {

      console.log("state.deleteContact()", this.state.contactID);

      // Delete from server.
      this.state.showHidePleaseWait(true);
      const contactsWorker: Contacts.Worker = new Contacts.Worker();
      await contactsWorker.deleteContact(this.state.contactID);
      this.state.showHidePleaseWait(false);

      // Remove from list.
      const cl = this.state.contacts.filter((inElement) => inElement._id != this.state.contactID);

      // Update state.
      this.setState({ contacts : cl, contactID : null, contactName : "", contactEmail : "" });

    }.bind(inParentComponent), /* End deleteContact(). */


    /**
     * Delete the currently viewed message.
     */
    deleteMessage : async function(): Promise<void> {

      console.log("state.deleteMessage()", this.state.messageID);

      // Delete from server.
      this.state.showHidePleaseWait(true);
      const imapWorker: IMAP.Worker = new IMAP.Worker();
      await imapWorker.deleteMessage(this.state.messageID, this.state.currentMailbox);
      this.state.showHidePleaseWait(false);

      // Remove from list.
      const cl = this.state.messages.filter((inElement) => inElement.id != this.state.messageID);

      // Update state.
      this.setState({ messages : cl, currentView : "welcome" });

    }.bind(inParentComponent), /* End deleteMessage(). */


    /**
     * Delete a message (from the server and the contact list).
     */
    sendMessage : async function(): Promise<void> {

      console.log("state.sendMessage()", this.state.messageTo, this.state.messageFrom, this.state.messageSubject,
        this.state.messageBody
      );

      // Send the message.
      this.state.showHidePleaseWait(true);
      const smtpWorker: SMTP.Worker = new SMTP.Worker();
      await smtpWorker.sendMessage(this.state.messageTo, this.state.messageFrom, this.state.messageSubject,
        this.state.messageBody
      );
      this.state.showHidePleaseWait(false);

      // Update state.
      this.setState({ currentView : "welcome" });

    }.bind(inParentComponent) /* End sendMessage(). */


  };

} /* End createState(). */
