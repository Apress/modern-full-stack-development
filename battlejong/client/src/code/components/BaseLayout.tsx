// React imports.
import React, { Component } from "react";

// Library imports.

// App imports.
import ControlArea from "./ControlArea";
import PlayerBoard from "./PlayerBoard";
import { createState } from "../state";


/**
 * The parent component of the entire app.
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
        <div className="playerBoard"><PlayerBoard state={ this.state } /></div>
        <div className="controlArea"><ControlArea state={ this.state } /></div>
      </div>

   );

  } /* End render(). */


} /* End class. */


export default BaseLayout;
