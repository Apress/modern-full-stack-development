function start() {

  class Bookmark extends React.Component {
    constructor(props) {
      super(props);
      console.log("Bookmark component created");
    }
    title = this.props.title;
    titleStyle = { color : "red" }
    render() {
      return (
        <li>
          <h2 style={this.titleStyle}>{this.title}</h2>
          <a href={this.props.href}>{this.props.description}</a>
          <button onClick={() => {
            this.title = this.title + "-CHANGED";
            this.setState({});
          }}>
          Click me
          </button>
        </li>
      );
    }
  }

  ReactDOM.render(
    <div>
      <h1>Bookmarks</h1>
      <ul>
        <Bookmark title={"Etherient"} href={"https://www.etherient.com"}
          description={"The home page of Etherient"}
        />
        <Bookmark title={"Frank's Site"} href={"https://www.zammetti.com"}
          description={"The web home of Frank W. Zammetti"}
        />
      </ul>
    </div>,
    document.getElementById("mainContainer")
  );

}
