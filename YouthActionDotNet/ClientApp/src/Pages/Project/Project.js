
import React from "react"
import JsPDF from 'jspdf';
import { Loading } from "../../Components/appCommon"
import { IconButtonWithText, MultiStepBox, StdButton, IconButton } from "../../Components/common"
import { StdInput } from "../../Components/input"
import DatapageLayout from "../PageLayout"

export default class Project extends React.Component {
    state={
        content:null,
        headers:[],
        loading:true,
        settings: {},
        error: "",
    }

    settings ={
        title:"Project",
        primaryColor: "#a6192e",
        accentColor: "#94795d",
        textColor: "#ffffff",
        textColorInvert: "#606060",
        api: "/api/Project/",
    }

    async componentDidMount(){
        await this.getContent().then((content)=>{
            console.log(content);
            this.setState({
                content:content,
            });
        })

        await this.getSettings().then((settings)=>{
            console.log(settings);
            this.setState({
                settings:settings,
            });
        })

        this.setState({
            loading:false,
        })
    }

    getSettings = async () => {
        // fetches http://...:5001/api/User/Settings
        return fetch(this.settings.api + "Settings" , {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }).then(res => {
            console.log(res);
            return res.json();
        })
    }

    getContent = async () =>{
        return fetch( this.settings.api + "All" , {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }).then(res => {
            console.log(res);
            //Res = {success: true, message: "Success", data: Array(3)}
            return res.json();
        });
    }

    update = async (data) =>{
        console.log(data);
        return fetch(this.settings.api + "UpdateAndFetch/" + data.UserId , {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        }).then(async res => {
            return res.json();
        });
    }

    handleUpdate = async (data) =>{
        await this.update(data).then((content)=>{
            if(content.success){
                this.setState({
                    error:"",
                })
                return true;
            }else{
                this.setState({
                    error:content.message,
                })
                return false;
            }
        })
    }

    requestRefresh = async () =>{
        this.setState({
            loading:true,
        })
        await this.getContent().then((content)=>{
            console.log(content);
            this.setState({
                content:content,
                loading:false,
            });
        })
    }
    
    requestError = async (error) =>{
        this.setState({
            error:error,
        })
    }


    render(){
        if(this.state.loading){
            return <Loading></Loading>
        }else{
            
        return(
            <DatapageLayout 
                settings={this.settings}
                fieldSettings={this.state.settings.data.FieldSettings} 
                headers={this.state.settings.data.ColumnSettings} 
                data={this.state.content.data}
                updateHandle = {this.handleUpdate}
                requestRefresh = {this.requestRefresh}
                error={this.state.error}
                permissions={this.props.permissions}
                requestError={this.requestError}
                extraComponents = {
                    [
                        {
                            label: "Generate PDF", 
                            key: "generatePDF", 
                            requiredPerms: ["Create","Update","Delete","Read"],
                            component: <GeneratePDF 
                            settings={this.settings} 
                            requestRefresh={this.requestRefresh} 
                            fieldSettings = {this.state.settings.data.FieldSettings} 
                            data={this.state.content.data} 
                            requestError={this.requestError}
                            api = {this.settings.api}>
                            </GeneratePDF>
                        }
                    ]
                }
                >
                {/* {this.state.content.data.map((item, index) => {
                    return (
                        <div className="staff-extended">
                            <PermissionsMap handleUpdate={this.handleUpdate} item={item}></PermissionsMap>
                        </div>
                    )
                })}     */}
            </DatapageLayout>
            )
        }
    }
}

class GeneratePDF extends React.Component{
    state={
        columns: [],
        pdfReady: false,
        loading:true,
    }
    
    componentDidMount(){
        let columns = [];
        console.log("Hello World");
        console.log(this.props.fieldSettings);
        for(var i = 0; i < Object.keys(this.props.fieldSettings).length; i++){
            columns.push(
                {
                    label: Object.keys(this.props.fieldSettings)[i],
                    key: Object.keys(this.props.fieldSettings)[i],
                }
            );
        }
        this.setState({
            columns: columns
        });
    }

    reOrderColumns = (index, direction) => {
        var tempColumns = this.state.columns;
        if(direction === "up"){
            if(index > 0){
                var temp = tempColumns[index];
                tempColumns[index] = tempColumns[index - 1];
                tempColumns[index - 1] = temp;
            }
        } else {
            if(index < tempColumns.length - 1){
                var temp = tempColumns[index];
                tempColumns[index] = tempColumns[index + 1];
                tempColumns[index + 1] = temp;
            }
        }
        this.setState({
            columns: tempColumns
        });
    }

    generatePDF = () =>{
        this.setState({
            pdfReady : false
        })

        // Fake loading time to show false sense of progress
        setTimeout(() => {
            this.setState({
                pdfReady : true
            })}, 1000);
    }
    exportPDF = () => {

        const report = new JsPDF('portrait','pt','a4');
        report.html(document.body).then(() => {
            report.save(this.props.settings.title + ".pdf");
        });
    }

    render(){
        return (
            <div className="container-fluid generate-spreadsheet">
                <div className="column-order">
                    {this.state.columns.map((column, index) => {
                        return <div className="column">
                            <div className="column-order-buttons">
                                <IconButton className={"invert"} icon={<i className="bi bi-arrow-up"></i>} onClick={() => this.reOrderColumns(index, "up")}></IconButton>
                                <IconButton className={"invert"} icon={<i className="bi bi-arrow-down"></i>} onClick={() => this.reOrderColumns(index, "down")}></IconButton>
                            </div>
                            <div className="column-name">{column.label}</div>
                        </div>
                    })}     
                </div>
                <div className="generate-actions">
                    <StdButton onClick={() => this.generatePDF()}>
                        Generate PDF
                    </StdButton>

                    {this.state.pdfReady ?
                    
                    // <CSVLink data={this.props.data} className={"forget-password"} headers={this.state.columns} filename={this.props.settings.title + ".csv"}>Download</CSVLink>
                    <button onClick={this.exportPDF} type="button">Export PDF</button>
                    :
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    }    
                </div>
            </div>
        )
    }

    
}

