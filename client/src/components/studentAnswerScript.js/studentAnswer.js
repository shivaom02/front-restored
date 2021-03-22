import axios from 'axios';
import React,{ useEffect, useState ,useRef} from 'react';
import WebViewer from "@pdftron/webviewer"
import { useParams, Link } from 'react-router-dom';
import "./studentAns.css";
import { markButton , buttonS , buttonM  , markContainerDesciption , markListStyle , questionAnswer } from './studentCSS';
import Navbar  from "../navbar/Navbar";
import {useHistory} from "react-router-dom";
import Loader from "../classroom_teacher_signup/Noresults";
const StudentAnswerScript=()=>{
  const viewer =useRef();
  const history=useHistory();
  const [ count , setCount ] = useState(0);

  const [ marksList , setMarksList ] = useState(null);

  const [ pdfSrc , setPdfSrc ] = useState(null);

  const [ questionPaper , setQuestionPaper ] = useState(null);

  const [ questionPaperType , setQuestionPaperType ] = useState(null);

  const [ student , setStudent ] = useState(null);

  const [ totalMarks , setTotalMarks ] = useState(0);

  const [ response , setResponse ] = useState(null);

  const { _id } = useParams();

  const arrayBufferToBase64 = (buffer)=>{
     
    var binary = '';
 
    var bytes = [].slice.call(new Uint8Array(buffer));
 
    bytes.forEach((b) => binary += String.fromCharCode(b));
 
    return window.btoa(binary);
  };
  
  useEffect(async ()=>{

   const response = await axios.get(`/student/getStudentDetails/${_id}`);
   

   await setStudent(response.data);

   console.log(response.data.student.owner);

   const questionPaper = await axios.get(`/exam/getQuestionPaper/${response.data.student.owner}`);

   const base64FlagQ = `data:${questionPaper.data.exam.questionPaperType};base64,`;
           
   const imageStrQ = arrayBufferToBase64(questionPaper.data.exam.questionPaper.data);
   
   setQuestionPaper( base64FlagQ + imageStrQ );

   setQuestionPaperType(questionPaper.data.exam.questionPaperType);

   console.log(questionPaper);

   await setMarksList(response.data.student.marksDistribution);
   
   await setTotalMarks(response.data.student.marks);

   const base64Flag = `data:${response.data.student.answerPaperType};base64,`;
           
   const imageStr = arrayBufferToBase64(response.data.student.answerPaper.data);
   
   setPdfSrc( base64Flag + imageStr );



  //  pdf tron
  WebViewer(
    {
      path: 'lib',
      initialDoc:"/file/FM.pdf",
    },
    viewer.current,
  ).then((instance) => {

    const arr = new Uint8Array(response.data.student.answerPaper.data);
    const blob = new Blob([imageStr], { type: 'application/pdf' });
    instance.loadDocument(blob, { filename: 'myfile.pdf' });

    const { docViewer, Annotations } = instance;
    const annotManager = docViewer.getAnnotationManager();
    docViewer.on('documentLoaded', () => {
      const rectangleAnnot = new Annotations.RectangleAnnotation();
      rectangleAnnot.PageNumber = 1;
      // values are in page coordinates with (0, 0) in the top left
      rectangleAnnot.X = 100;
      rectangleAnnot.Y = 150;
      rectangleAnnot.Width = 500;
      rectangleAnnot.Height = 600;
      rectangleAnnot.Author = annotManager.getCurrentUser();

      annotManager.addAnnotation(rectangleAnnot);
      // need to draw the annotation otherwise it won't show up until the page is refreshed
      annotManager.redrawAnnotation(rectangleAnnot);
    });
  });


  },[])

  const handleChange = (e)=>{
    setCount(e.target.value);
  }

  const onSubmit = async (e)=>{
    
    e.preventDefault();
    
    let marks=[];

    for(let i=0;i<count;i++){
      marks.push({ 'index' : i+1 , 'mark' : 0 });
    }

    await setMarksList(marks);

    console.log(marksList);
  }

  const changeMarks = async (e)=>{

     if(parseInt(e.target.value)<0)
       return;

     const list = marksList.map(m => {
      if(parseInt(m.index)===parseInt(e.target.name)){
        
        return{
            index:m.index,
            mark:e.target.value
          }
       }else{
        return{
          index:m.index,
          mark:m.mark
        }       
       }
     })
    await setMarksList(list);

    const total = list.reduce((acc, curr) => (
      acc + parseInt(curr.mark)
   ), 0)
    await setTotalMarks(total);

  }

  const submitMarks = async (e)=>{
      e.preventDefault();
      
      console.log('marksList',marksList);
      
      console.log('total marks',totalMarks);
      
      const config ={
        header:{
          'Content-type':'application/json'
        }
      }

      const stu = {
        marksDistribution : marksList,
        marks : totalMarks,
        status:true
      }

      console.log(stu)

      const res = await axios.patch(`/student/updateStudent/${_id}`,stu,config);

      res.data.error===null?
         setResponse('The answer Script is being checked. Click here to go back'):
         setResponse(`An error Occured ${res.data.error}`);
      
  }

  const buttonStyle =  {
    textAlign: 'center',
    padding:'1.5% 1% 1.5% 1%',
    width: '25%',
    backgroundColor: '#252525',
    color:'rgb(255, 255, 255)',
    border:'whitesmoke',
    border:'10px',
    borderRadius:'1vw',
    outline: 'none',
    border: '2px solid #b9babb',
    fontSize: 'large'
}

  return (
    <div className="App">
        <Navbar />
        { marksList===null || marksList.length===0 ?
              <div style={{display:"flex",justifyContent:"center"}}>
                   {/* <label style={{color:'white'}} >Enter the number of questions</label>
      
                   <form onSubmit={onSubmit}>
         
                        <input type='number' name='number' value={count} placeholder="Enter the main question Number" onChange={handleChange}/>
         
                        <button type='submit'>Create</button>
                   </form>
              <br /> */}
              <Loader/>
              </div>
            :
            <>
            <div className="top_section_exam">
              
                <div  className="section_marking">
                <div  className="header_exam_section">
                 <span>Question Numbers</span>
                 
                 <span >Marks Given</span>
                </div> 
                
                  {marksList.map(c => 
                   
                    <div style={markButton} className="btn_marks">
                   
                        <button style={buttonS} key={c.index}>{c.index}</button>
                   
                        <input type='Number' name={`${c.index}`} style={buttonM} key={c.index*100} value={c.mark} onChange={changeMarks} />
                     </div>
                  )}
                  { marksList!==null ?
                      
                      <div className="tot_marks">
                      
                        <span>Total Marks</span><br/>
                      
                        <button style={{padding:'2px 3px'}}>{totalMarks}</button>
                    
                      </div>
                  : null}
                </div>
                
            </div> 
            <div  className="status_detail_jt">
                  <div className="details_com">
                      <div className="student_details">
                          <h3 className="title_is">Student Details</h3>
                          
                          <div className="name_editor">
                            <span>Name:</span>
                            <span className="name_is">Pinky Sharma</span>
                          </div>
                          <div className="roll_is">
                            <span>Roll No:</span>
                            <span>1916234</span>

                          </div>
                          <div className="sub_is">
                            <span>Subject:</span>
                            <span>Data Structure</span>
                          </div>
                        </div>
                  </div>
                  <div className="status_is_jt">
                  {response!==null?
                  <>
                    <h3>Status: Checked</h3>
                    <button onClick={()=>{history.goBack()}}>{response}</button>
                  </>:<h3>Status: Unchecked</h3>}
                  </div>
                  
            </div>
            </>

      }
        
      
      <div className="paper_container_exam">
                
       { questionPaper !==null ?
          <embed type={questionPaperType} src={questionPaper} style={{width:'600px' , height:'1000px'}}></embed>
           : <iframe id="tExamqpaper" src="embed.pdf" width="600" height="1000"></iframe>}  

      
       { student !==null ?
         <>
         {console.log(questionPaper,"jiti")}
          {/* <embed type={student.student.answerPaperType} src={questionPaper} style={{width:'700px' , height:'1000px'}}></embed>  */}
          
         </>
       : <iframe id="tExamqpaper" src="embed.pdf" width="700" height="1000"></iframe>} 
      </div>
          <div className="">
            <div className="" ref={viewer}></div>
          </div>
        <form onSubmit={submitMarks} className="submit_sheet_check">
           
           <button type='submit' style={buttonStyle}>Submit Marks</button>            
        </form>
        
        
    </div>
  );
}

export default StudentAnswerScript;

