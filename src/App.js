import React, { useEffect, createRef, useState } from 'react';
import Fade from 'react-reveal/Fade';
import DownloadLink from "react-download-link";
import './App.scss';

const OVER_BREAK = 5;

function App() {

  //Set up hooks-----------------------------------
    const[returnedAA, setReturnedAA] = 
    useState({associate: 'N/A', 
              duration: {hour: 0, minute: 0, second: 0,}
            });

  const [BREAK_TIME, setBreakTime] = useState(15);
  const [break_time, setBreak] = useState(15);
  const [acknowledge, setAcknowledge] = useState(0);
  const [associate, setAssociate] = useState('');
  const [AA_on_break, setAAOnBreak] = useState([]);
  const [no_associate, setNoAssociate] = useState(true);
  const [AAReturn, setAAReturn] = useState(false);

  const onChangeAssociate = (event) => {
    setAssociate(event.target.value);
  }
  //=============End set up hooks=================

  //Make the cursor focus on input field upon launch
  const inputRef = createRef();
  const durationRef = createRef();
  useEffect(
    () => {
      if (inputRef.current && associate === '' && break_time === '')
        inputRef.current.focus();

        //Make the browser promt confirmation before leaving page
        window.addEventListener('beforeunload', function (e) {
          e.preventDefault();
          e.returnValue = '';
        });

        //Set acknowledge to display acknowledge message
        if (acknowledge === 0) setAcknowledge(1);
    }
  ,[inputRef, acknowledge, associate, durationRef, break_time])
  //================End cursor focus===============




  //Submit Badge Scan-----------------------------
  const onSubmit = (event) => {
    setNoAssociate(false);

    //Prevent default html form submission
    event.preventDefault();

    //Search for badge in being on break list-----
    var found = false;
    var i = 0;

    for (i = 0; i < AA_on_break.length; i++)
    {
      if (AA_on_break[i].associate === associate)
      {
        found = true;
        break;
      }
    }
    //==============End search=====================

    //Associate has not gone to break, add AA on to break list
    if(!found || AA_on_break.length === 0)
    {
      //Display going to break message
      setAAReturn(false);
      setAAOnBreak([...AA_on_break, {associate, 
                                      time_out: new Date(),
                                      duration: 0,
                                    }]);
    }
    
    //Associate is on break list, returning to work
    else {  
      //Display time message
      setAAReturn(true);

      //Get the duration of Associate's break
      const now = new Date();
      var duration = now - AA_on_break[i].time_out;

      //Calculate the total minutes of Associate's break
      const totalMinute = Math.floor(duration/(1000*60));
      
      //Calculate duration with hour, minute, second
      const hour = Math.floor(duration/(1000*60*60));
      duration %= (1000*60*60);
      const minute = Math.floor(duration/(1000*60));
      duration %= (1000*60);
      const second = Math.floor(duration/1000);
      
      
      //set hook to display break duration
      setReturnedAA({associate: AA_on_break[i].associate, 
        duration:{hour, minute, second}});
          
      //Add break_in time for returned AA
      setAAOnBreak(AA_on_break.map(
        (item) => {
          if (item.associate === associate)
            return ({...item, time_in: now, duration: totalMinute});
          else return item;
        }))
    }

    //Reset values
    inputRef.current.value = '';
    setAssociate('');
  }

  //Set the background of duration to reflect the duration
  //BREAK_TIME minutes: green < OVER_BREAK minutes yello < red 
  const backgroundStyle = (returnedAA) =>
  {
    const red = {backgroundColor: 'rgba(249, 0, 0, 0.3)'};
    const yellow = {backgroundColor: 'rgba(249, 249, 0, 0.3)'};
    const green = {backgroundColor: 'rgba(0, 249, 0, 0.3)'};

    if(returnedAA.duration)
    {
      if ((returnedAA.duration.hour > 0) 
        || (returnedAA.duration.minute > BREAK_TIME + OVER_BREAK))
        return red;

      else if (returnedAA.duration.minute > BREAK_TIME)
                return yellow;

      else return green;
    }
    else return null;
  }

  const getAABeingOnBreak = () => AA_on_break.filter(item => !item.time_in);
  const getAAReturnedFromBreak = () => AA_on_break.filter(item => item.time_in);
  const getAAOverBreak = () => AA_on_break.filter(item => (item.duration && item.duration > BREAK_TIME + OVER_BREAK));

  //Prepare the CSV file to download list of AA overbreak
  const prepareCSV = (AA_list) => {
    var myCSVContent = new Date().toLocaleDateString() + 
      '\nAssociate,time_out,time_in,Duration\n';
    
    AA_list.map(
      (item) => myCSVContent += item.associate + ',' 
        + item.time_out.toLocaleTimeString() + ','
        + ((item.time_in)? item.time_in.toLocaleTimeString() : 'N/A') + ','
        + ((item.time_in)? item.duration : 'N/A') + '\n');

    return myCSVContent;
  }

  const getMessage = () => {
    if (no_associate) 
      return (<p id ='time-reporter'>No Associates have gone to break yet!</p>)
    else if (!AAReturn)
    {
      return (
        <p id ='time-reporter'>
          Associate is going to break!
        </p>
      )
    }
    else return (              
      <p style={backgroundStyle(returnedAA)} id='time-reporter'>
      Associate: {returnedAA.associate} &nbsp; 
      Duration: {returnedAA.duration.hour} hours	&nbsp; 
        {returnedAA.duration.minute} minutes 	&nbsp;
        {returnedAA.duration.second} seconds 
      </p>);
  }

  return (
    <div>
      <Fade bottom when={(acknowledge === 1)}>
        <div style={(acknowledge === 1) ? {zIndex: '100'} : {zIndex: '-1'}}  id='acknowledge-page'>
          <section>
            <h1>WARNING!</h1>
            <p>Please do NOT close this tab, navigate from, or refresh this page 
              until you are finished working with this application.<br/>
              Doing so will erase ALL DATA stored on this page.</p>
            <div style={{display: 'flex', flexDirection: 'row'}}>
              <p>Enter break duration:</p><input placeholder='15' 
                onChange={(event) => setBreak(event.target.value)}
                ref={durationRef}></input>
            </div>
            <button onClick={()=> {
                                    setBreakTime(parseInt(break_time, 10));
                                    setAcknowledge(2); 
                                    setBreak('');
              }}>OK, I understand</button>
          </section>
        </div>
      </Fade>

      <Fade when={(acknowledge === 2)}>
        <div id='screen-wrapper'>
          <div id='left-screen' style={{display: 'flex', flexDirection: 'column'}}>
            <div className='round-border' id='each-section'>
              <form onSubmit={onSubmit}>
                <h1>Break time management</h1>
                <input placeholder="Scan Associate's badge" 
                  type='text' ref={inputRef} 
                  onChange={onChangeAssociate}>
                </input>
              </form>
              <div style={{display: 'flex', flexDirection: 'row', 
                  justifyContent: 'space-between', marginTop: '20px'}}>
                <h3>Number of AA went to break: {AA_on_break.length}</h3>
                <DownloadLink label="Get CSV" filename="AA_on_break.csv" exportFile={() => prepareCSV(AA_on_break)}/>
              </div>

            </div>

            <div className='round-border' id='each-section'>

              <div style={{display: 'flex', flexDirection: 'row', 
                  justifyContent: 'space-between'}}>
                <h3>Number of AA returned from break: {getAAReturnedFromBreak().length}</h3>
                <DownloadLink label="Get CSV" filename="AA_on_break.csv" exportFile={() => prepareCSV(getAAReturnedFromBreak())}/>
              </div>
              {
                getMessage()
              } 
            </div>

            <div className='round-border' id='each-section'>
              <div style={{display: 'flex', flexDirection: 'row', 
                justifyContent: 'space-between', marginBottom: '20px'}}>
                <h3>Associates break over {BREAK_TIME + OVER_BREAK} minutes:</h3>
                <DownloadLink label="Get CSV" filename="AA_on_break.csv" exportFile={() => prepareCSV(getAAOverBreak())}/>
              </div>

              <ol id='over-break'>
                {getAAOverBreak().map(item => <li key={item.associate}>
                  <p>{item.associate}</p>
                  <p>{item.duration} minutes</p>
                </li>)}
              </ol>
            </div>

          </div>

          <div className='round-border' id='each-section'>
            <div style={{display: 'flex', flexDirection: 'row', 
                  justifyContent: 'space-between'}}>
              <h3>Associates being on break: {getAABeingOnBreak().length}</h3>
              <DownloadLink label="Get CSV" filename="AA_on_break.csv" exportFile={() => prepareCSV(getAABeingOnBreak())}/>
            </div>
            <ol>
              <li style={{fontWeight: 'bold'}}>
                <p>Associate</p><p>Time out</p>
              </li>

              {getAABeingOnBreak().map(
                (item) => <li key={item.associate}>
                              <p>{item.associate}</p>
                              <p>{item.time_out.toLocaleTimeString()}</p>
                          </li>)
              }
            </ol>
          </div>
        </div>
      </Fade>

    </div>
  );
}


export default App;
