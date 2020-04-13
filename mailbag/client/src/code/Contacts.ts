// Library imports.
import axios, { AxiosResponse } from "axios";

// App imports.
import { config } from "./config";

// Define interface to describe a contact.  Note that we'll only have an _id field when retrieving or adding, so
// it has to be optional.
export interface IContact { _id?: number, name: string, email: string }


// The worker that will perform contact operations.
export class Worker {


  /**
   * Returns a list of all contacts from the server.
   *
   * @return An array of objects, on per contact.
   */
  public async listContacts(): Promise<IContact[]> {

    console.log("Contacts.Worker.listContacts()");

    const response: AxiosResponse = await axios.get(`${config.serverAddress}/contacts`);
    return response.data;

  } /* End listContacts(). */


  /**
   * Add a contact to the server.
   *
   * @oaram  inContact The contact to add.
   * @return           The inContact object, but now with a _id field added.
   */
  public async addContact(inContact: IContact): Promise<IContact> {

    console.log("Contacts.Worker.addContact()", inContact);

    const response: AxiosResponse = await axios.post(`${config.serverAddress}/contacts`, inContact);
    return response.data;

  } /* End addContact(). */


  /**
   * Delete a contact from the server.
   *
   * @oaram inID The ID (_id) of the contact to add.
   */
  public async deleteContact(inID): Promise<void> {

    console.log("Contacts.Worker.deleteContact()", inID);

    await axios.delete(`${config.serverAddress}/contacts/${inID}`);

  } /* End deleteContact(). */


} /* End class. */
