// React imports.
import React from "react";

// Material-UI imports.
import Chip from "@material-ui/core/Chip";
import List from "@material-ui/core/List";


/**
 * Mailboxes.
 */
const MailboxList = ({ state }) => (

  <List>

    { state.mailboxes.map(value => {
      return (
        <Chip label={ `${value.name}` } onClick={ () => state.setCurrentMailbox(value.path) }
          style={{ width:128, marginBottom:10 }}
          color={ state.currentMailbox === value.path ? "secondary" : "primary" } />
      );
     } ) }

  </List>

); /* Mailboxes. */


export default MailboxList;
