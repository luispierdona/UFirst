import { Component, OnInit, ViewChild } from '@angular/core';
import { Papa } from 'ngx-papaparse';
import { ChartType } from 'chart.js';
import { MultiDataSet, Label, SingleDataSet } from 'ng2-charts';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  file: any; result = [];
  // Doughnut | HTTP Methods
  public doughnutChartLabels: Label[] = ['GET', 'POST', 'HEAD', 'invalid'];
  public doughnutChartData: MultiDataSet = [[0, 0, 0, 0]];
  public doughnutChartType: ChartType = 'doughnut';
  // PIE | Response Codes
  public pieChartLabels: Label[] = [];
  public pieChartData: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;
  // PolarArea | Requests per Minute
  public polarAreaChartLabels: Label[] = ['DAY', 'HOUR', 'MIN'];
  public polarAreaChartData: SingleDataSet = [0, 0, 0];
  public polarAreaLegend = true;
  public polarAreaChartType: ChartType = 'polarArea';

  jsonToExport = new Array(); downloadJsonHref;
  enable = false;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator; dataSource;
  displayedColumns: string[] = ['document_size', 'host', 'response_code'];
  constructor(private papa: Papa, private sanitizer: DomSanitizer, private _snackBar: MatSnackBar) { }

  ngOnInit() {
  }

  fileChanged(e) {
    this.file = e.target.files[0];
    this.parseFile(this.file);
  }

  parseFile(csvData) {
    const options = {
      delimiter: ' ',
      delimitersToGuess: [':', '[', ']'],
      complete: (results, file) => {
          this.result = results.data;
          this.parseData();
      }
    };
    this.papa.parse(csvData, options);
  }

  parseData() {
    let entryData = this.result;

    if (entryData && entryData.length !== 0) {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < entryData.length; i++) {
        let obj = {
          host: entryData[i][0],
          datetime: {
            day: this.getDate(entryData[i][1], 'day'),
            hour: this.getDate(entryData[i][1], 'hour'),
            minute: this.getDate(entryData[i][1], 'minute'),
            second: this.getDate(entryData[i][1], 'second')
          },
          request: {
            method: this.getRequest(entryData[i][2], 'method'),
            url: this.getRequest(entryData[i][2], 'url'),
            protocol: this.getRequest(entryData[i][2], 'protocol'),
            protocol_version: this.getRequest(entryData[i][2], 'protocol_version'),
          },
          response_code: entryData[i][3],
          document_size: entryData[i][4]
        };
        this.jsonToExport.push(obj);
        this.enable = true;
      }
      // console.log(this.jsonToExport);
      this.generateDownloadJsonUrai();
      this.generateCharts();
    }

  }

  getDate(str: string, key: string): string {
    let entryData = str;
    if (entryData && entryData !== '') {
      entryData = entryData.slice(1, -1);
      switch (key) {
        case 'day':
          return entryData.substring(0, 2);
        case 'hour':
          return entryData.substring(3, 5);
        case 'minute':
          return entryData.substring(6, 8);
        case 'second':
          return entryData.substring(9, 11);
        default:
          break;
      }
    } else {
      return '';
    }
  }

  getRequest(str: string, key: string): string {
    if (str && str !== '') {
      let x = str.split(' ');
      switch (key) {
        case 'method':
          return x[0];
        case 'url':
          return x[1];
        case 'protocol':
          return this.getProtocol(x[2], 'protocol');
        case 'protocol_version':
          return this.getProtocol(x[2], 'protocol_version');
        default:
          break;
      }
    } else {
      return '';
    }
  }

  getProtocol(str: string, key: string): string {
    if (str && str !== '') {
      let x = str.split('/');
      switch (key) {
        case 'protocol':
          return x[0];
        case 'protocol_version':
          return x[1];
        default:
          break;
      }
    } else {
      return '';
    }
  }

  // events
  public chartClicked({ event, active }: { event: MouseEvent, active: {}[] }): void {
    // console.log(event, active);
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    // console.log(event, active);
  }

  generateDownloadJsonUrai() {
    let theJSON = JSON.stringify(this.jsonToExport);
    let uri = this.sanitizer.bypassSecurityTrustUrl('data:text/json;charset=UTF-8,' + encodeURIComponent(theJSON));
    this.downloadJsonHref = uri;
  }

  generateCharts() {
    if (this.jsonToExport && this.jsonToExport !== undefined && this.jsonToExport.length !== 0) {
      // HTTP METHODS
      const countHttpMethodsGet = this.jsonToExport.filter((obj) => obj.request.method === 'GET').length;
      const countHttpMethodsPost = this.jsonToExport.filter((obj) => obj.request.method === 'POST').length;
      const countHttpMethodsHead = this.jsonToExport.filter((obj) => obj.request.method === 'HEAD').length;
      const countHttpMethodsInvalid = this.jsonToExport.filter((obj) => obj.request.method === '').length;
      // console.log(countHttpMethodsGet, countHttpMethodsPost, countHttpMethodsHead, countHttpMethodsInvalid);
      this.doughnutChartData = [[countHttpMethodsGet, countHttpMethodsPost, countHttpMethodsHead, countHttpMethodsInvalid]];

      // RESPONSE CODES
      let RESPONSE_CODES =
        this.jsonToExport.map(item => item.response_code).filter((value, index, self) => self.indexOf(value) === index);
      let RESPONSE_CODES_QTY = [];
      if (RESPONSE_CODES && RESPONSE_CODES.length !== 0) {
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < RESPONSE_CODES.length; i++) {
          if (RESPONSE_CODES[i] && RESPONSE_CODES[i] !== undefined) {
            if ((RESPONSE_CODES[i].toString()).length !== 3) {
              RESPONSE_CODES[i] = undefined;
            }
          }
        }
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < RESPONSE_CODES.length; i++) {
          let qty = 0;
          qty = qty + this.jsonToExport.filter((obj) => obj.response_code === RESPONSE_CODES[i]).length;
          RESPONSE_CODES_QTY.push(qty);
        }
      }
      // console.log(RESPONSE_CODES);
      // console.log(RESPONSE_CODES_QTY);
      this.pieChartLabels = RESPONSE_CODES;
      this.pieChartData = RESPONSE_CODES_QTY;
    }
    this.getReqXMin();
    this.fillTableSize();
  }

  getReqXMin() {
    let requestTotal = [];
    let requestXDay = [];
    requestTotal = this.jsonToExport.map(item => item.datetime.day).filter((value, index, self) => self.indexOf(value) === index);
    if (requestTotal && requestTotal.length !== 0) {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < requestTotal.length; i++) {
        if (requestTotal[i] && requestTotal[i] !== '' && requestTotal[i] !== undefined) {
          let xDay = this.jsonToExport.filter((obj) => obj.datetime.day === requestTotal[i]).length;
          requestXDay.push(xDay);
        }
      }
      // console.log(requestTotal);
      // console.log(requestXDay);
      const rqstDay: number = requestTotal.length;
      let rqstXDay = 0;
      let rqstXHour = 0;
      if (requestXDay && requestXDay.length !== 0 && requestXDay !== undefined) {
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < requestXDay.length; i++) {
          rqstXDay = rqstXDay + requestXDay[i];
        }
        rqstXHour = rqstXDay / 24;
      }
      this.polarAreaChartData = [rqstDay, rqstXDay, rqstXHour];
    }

  }

  fillTableSize() {
    this.dataSource = new MatTableDataSource(this.jsonToExport);
    this.dataSource.paginator = this.paginator;
    this._snackBar.open('Info & Chars Loaded', 'close', { duration: 2000, });
  }

}
