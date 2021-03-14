import "./App.css";
import React, { Component } from "react";
import moment from 'moment';

const columnHeader = [
  "State Name",
  "Date",
  "Covid-19 Deaths",
  "% US Covid-19 Deaths"
];

class App extends Component {
  // call super on props from Component parent class
  constructor(props) {
    super(props);
    // sets the state of the data being pulled from API
    this.state = {
      //array to hold incoming data
      data: [],

      filter: "",

      // to know when items have been loaded
      isLoading: false,
      isError: false
    };
    this.generateHeader = this.generateHeader.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  // function get request to CDC API using lifecycle function and set as async function
  async componentDidMount() {
    this.setState({ isLoading: true });

    // await is permitted since it is an async function
    // used SoQL query to get entire list of submissions
    const response = await fetch(
      "https://data.cdc.gov/resource/9mfq-cb36.json?$limit=50000"
    );

    // .json() returns a promise (value may or may not be known)
    if (response.ok) {
      const data = await response.json();
      console.log(data);

      // after reading to console update data and isLoading ELSE error thrown
      this.setState({ data, isLoading: false });
      this.sortByState()
    } else {
      this.setState({ isError: true, isLoading: false });
    }
  }

  // get very first object and use map method to loop through
  renderTableHeader = () => {
    //key is required in map function
    return Object.keys(this.state.data[0]).map((attr) => (
      <th key={attr}>{attr.toUpperCase()}</th>
    ));
  };

  // iterates columnHeader and displays them respectively
  generateHeader() {
    let res = []
    for (var i = 0; i < columnHeader.length; i++) {
      res.push(<th key={columnHeader[i]}>{columnHeader[i]}</th>)
    }
    return res;
  }

  /* 
  Sorts by submission date of each object followed by sorting them by state.
  It then pushes the most recent submission date of each unique state.
  Lastly, it sorts each unique state in descending order by total death count.
  */
  sortByState() {
    let sortedDate = this.state.data
      .sort((a, b) => new Date(a.submission_date) !== new Date(b.submission_date)
        ? new Date(a.submission_date) < new Date(b.submission_date)
          ? 1
          : -1
        : 0);

    let sortedState = sortedDate
      .sort((a, b) => a.state !== b.state
        ? a.state < b.state
          ? -1
          : 1
        : 0);

    let uniqueStates = [];
    let result = []
    sortedState.forEach((c) => {
        if (!uniqueStates.includes(c.state)) {
            uniqueStates.push(c.state);
            result.push(c)
        }
    }); 
    
    let sortedDeath = result
      .sort((a, b) => parseInt(a.tot_death) !== parseInt(b.tot_death)
        ? parseInt(a.tot_death) < parseInt(b.tot_death)
          ? 1
          : -1
        : 0);
  
    let Finalresult = []
    sortedDeath.forEach((c) => {
    Finalresult.push(c)
    });

    const totalDeaths = Finalresult.reduce((a, b) => {
      return a + parseInt(b.tot_death)
    }, 0)
    console.log(totalDeaths)

    const newResult = Finalresult.map((c) => {
      c.deathPercentage = this.generatePercent(c.tot_death, totalDeaths)
      return c
    })

    this.setState({ data: newResult})
  }

  // calculates percentage by summing up all total deaths above and dividing each state death count by total deaths
  generatePercent(deathState,totDeath) {
    return ((deathState / parseInt(totDeath)) * 100).toFixed(2) + '%'
  }

  // maps each object of data to their respective columns and uses moment to reformat submission_date
  renderTableRows = () => {
    return this.state.data.map((data) => {
      return (
        <tr key={data.tot_cases+data.submission_date+data.state}>
          <td>{data.state}</td>
          <td>{moment(data.submission_date).format('l')}</td>
          <td>{data.tot_death}</td>
          <td>{data.deathPercentage}</td>
        </tr>
      );
    });
  };

  // handles the input the users type into search filter and displays the data respectively
  handleChange(event) {
    this.setState({filter:event.target.value, filteredData: this.state.data.filter((item) => {
      if(event.target.value == "") return true
      return item.state.includes(event.target.value.toUpperCase())
    })})
  }

  // Handles the data shown on table based on search result using filteredData
  renderFilteredTableRows = () => {
    return this.state.filteredData.map((data) => {
      return (
        <tr key={data.tot_cases+data.submission_date+data.state}>
          <td>{data.state}</td>
          <td>{moment(data.submission_date).format('l')}</td>
          <td>{data.tot_death}</td>
          <td>{data.deathPercentage}</td>
        </tr>
      );
    });
  };

  render() {
    // grab three variables from state
    const { data, isLoading, isError } = this.state;

    if (isLoading) {
      return <div>Currently Loading...</div>;
    }
    if (isError) {
      return <div>Error thrown...</div>;
    }

    return data.length > 0 ? (
      <div style = {{display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center"}}>
        <div style = {{flex: 1}}> <input placeholder = {"Search specific state"} value = {this.state.filter} onChange = {this.handleChange} /> </div> 
        <h1>Covid-19 Deaths</h1>
        <div style = {{flex: 1}}>
        <table>
          <tbody>
            <tr>{this.generateHeader()}</tr>
            {(this.state.filteredData && this.state.filter) ? this.renderFilteredTableRows() : this.renderTableRows()}
          </tbody>
        </table>
        </div>
      </div>
    ) : (
      <div> No Data </div>
    );
  }
}

export default App;