import {Component, Input, OnInit, ViewContainerRef} from "@angular/core";
import {TisResponseResult, TISService} from "../service/tis.service";
import {EditorConfiguration} from "codemirror";
import {BasicFormComponent} from "../common/basic.form.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {HttpParams} from "@angular/common/http";
//  @ts-ignore
import * as $ from 'jquery';
import {PojoComponent} from "./pojo.component";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {LocalStorageService} from "angular-2-local-storage";

const LocalStoreTags = 'local_Store_Tags';

@Component({
  template: `
      <div class="tool-bar">
          <button nz-button
                  nz-popover
                  nzType="link"
                  nzPopoverTitle="请选择"
                  nzPopoverTrigger="click"
                  [nzPopoverContent]="serverNodesTpl"
                  nzPopoverPlacement="bottomLeft">引擎节点
          </button>
          <ng-template #serverNodesTpl>
              <table width="500">
                  <tr>
                      <td width="50%">
                      </td>
                      <td align="right">
                          <button nzSize="small" nz-button id="selectall" (click)="selectAllServerNodes()">全选</button> &nbsp;
                          <button nzSize="small" nz-button id="unselectall" (click)="unSelectAllServerNodes()">全不选</button>
                      </td>
                  </tr>
              </table>
              <table width="100%" border="1">
                  <tr *ngFor="let i of querySelectServerCandiate">
                      <td width="40px">第{{i.key}}组</td>
                      <td>
                          <label nz-checkbox name="serverNode" *ngFor="let server of i.value" [(ngModel)]="server.checked"><span [class.leader-node]="server.leader">{{server.ip}}</span></label>
                      </td>
                  </tr>
              </table>
          </ng-template>
          <button nz-button nzType="link" (click)="openPOJOView()">POJO</button>
          <div style="float: right">
              <nz-tag *ngFor="let tag of this.localStoreTags" nzMode="closeable" (nzOnClose)="deleteQueryFormTag(tag.tagName)">
                  <a href="javascript:void(0)" (click)="queryFormTagClick(tag.tagName)">{{tag.tagName}}</a>
              </nz-tag>
          </div>
      </div>
      <form method="post" id="queryForm" class="ant-advanced-search-form">
          <fieldset>
              <div>
                  <span>query:</span>
                  <span class="help"><a target="_blank"
                                        href="http://wiki.apache.org/solr/SolrQuerySyntax">Solr查询语法</a></span>
                  <br/>
                  <tis-codemirror name="q" [(ngModel)]="queryForm.q" [size]="{width:800,height:60}" [config]="codeMirrirOpts"></tis-codemirror>
              </div>

              <div nz-row [nzGutter]="24">
                  <div nz-col [nzSpan]="6">
                      <nz-form-item class="search-query-item">
                          <nz-form-label [nzSpan]="6" [nzFor]="'field_sort'">Sort</nz-form-label>
                          <nz-form-control [nzSpan]="18">
                              <input nz-input placeholder="create_time desc" id="field_sort" [(ngModel)]="queryForm.sort" name="sort"/>
                          </nz-form-control>
                      </nz-form-item>
                  </div>
                  <div nz-col [nzSpan]="6">
                      <nz-form-item class="search-query-item">
                          <nz-form-label [nzSpan]="8" [nzFor]="'start_rows'">Start/Rows</nz-form-label>
                          <nz-form-control [nzSpan]="16">
                              <input nz-input name="start" style="width: 40%" [(ngModel)]="queryForm.start" value="0" size="4"/>/<input style="width: 40%" nz-input name="shownum" [(ngModel)]="queryForm.shownum" size="4"/>
                          </nz-form-control>
                      </nz-form-item>
                  </div>
              </div>
              <div nz-row [nzGutter]="24" *ngIf="queryForm.advanceQuery">
                  <div nz-col [nzSpan]="6">
                      <nz-form-item class="search-query-item">
                          <nz-form-label [nzSpan]="6">Distrib</nz-form-label>
                          <nz-form-control [nzSpan]="18">
                              <nz-switch name="distrib" [(ngModel)]="queryForm.distrib" [nzCheckedChildren]="checkedTemplate" [nzUnCheckedChildren]="unCheckedTemplate"></nz-switch>
                              <ng-template #checkedTemplate><i nz-icon nzType="check"></i></ng-template>
                              <ng-template #unCheckedTemplate><i nz-icon nzType="close"></i></ng-template>
                          </nz-form-control>
                      </nz-form-item>
                  </div>
                  <div nz-col [nzSpan]="6">
                      <nz-form-item class="search-query-item">
                          <nz-form-label [nzSpan]="6">Debug</nz-form-label>
                          <nz-form-control [nzSpan]="18">
                              <nz-switch name="debug" [(ngModel)]="queryForm.debug" [nzCheckedChildren]="checkedTemplate" [nzUnCheckedChildren]="unCheckedTemplate"></nz-switch>
                              <ng-template #checkedTemplate><i nz-icon nzType="check"></i></ng-template>
                              <ng-template #unCheckedTemplate><i nz-icon nzType="close"></i></ng-template>
                          </nz-form-control>
                      </nz-form-item>
                  </div>
                  <div nz-col [nzSpan]="6">
                      <nz-form-item class="search-query-item">
                          <nz-form-label [nzSpan]="6">Raw</nz-form-label>
                          <nz-form-control [nzSpan]="18">
                              <input nz-input name="raw" [(ngModel)]="queryForm.rawParams"/>
                          </nz-form-control>
                      </nz-form-item>
                  </div>
                  <div nz-col [nzSpan]="6">
                      <nz-form-item class="search-query-item">
                          <nz-form-label [nzSpan]="6">Fl</nz-form-label>
                          <nz-form-control [nzSpan]="18">
                              <button nz-button nzType="link" nz-popover
                                      nzType="link"
                                      nzPopoverTitle="请选择"
                                      [nzPopoverContent]="colsTpl"
                                      nzPopoverTrigger="click"
                                      nzPopoverPlacement="bottomLeft"><i nz-icon nzType="select" nzTheme="outline"></i>选择
                              </button>
                              <ng-template #colsTpl>
                                  <div style="width:850px">
                                      <p style="text-align: right;">
                                          <button nz-button nzSize="small" id="fieldselectall" (click)="setSelectableCols(true)"><i nz-icon nzType="check" nzTheme="outline"></i>全选</button> &nbsp;
                                          <button nz-button nzSize="small" id="fieldunselectall" (click)="setSelectableCols(false)">全不选</button>
                                      </p>
                                      <ul class="cols-block">
                                          <li *ngFor="let col of this.queryForm.cols"><label nz-checkbox name="serverNode"
                                                                                             [(ngModel)]="col.checked" [ngModelOptions]="{standalone: true}">{{col.name}}</label></li>
                                      </ul>
                                  </div>
                              </ng-template>
                          </nz-form-control>
                      </nz-form-item>
                  </div>
                  <div nz-col [nzSpan]="6">
                      <nz-form-item class="search-query-item">
                          <nz-form-label [nzSpan]="6"><label nz-checkbox name="serverNode" [(ngModel)]="queryForm.facet.facet" [ngModelOptions]="{standalone: true}">Facet</label></nz-form-label>
                          <nz-form-control [nzSpan]="18">
                              <div *ngIf="queryForm.facet.facet">
                                  <input nz-input name="facetField" placeholder="facetField" [(ngModel)]="queryForm.facet.facetField"/>
                                  <input nz-input name="facetPrefix" placeholder="facetPrefix" [(ngModel)]="queryForm.facet.facetPrefix"/>
                                  <input nz-input name="facetQuery" placeholder="facetQuery" [(ngModel)]="queryForm.facet.facetQuery"/>
                              </div>
                          </nz-form-control>
                      </nz-form-item>
                  </div>
                  <div nz-col [nzSpan]="6">
                      <nz-form-item class="search-query-item">
                          <nz-form-label [nzSpan]="6">FQ</nz-form-label>
                          <nz-form-control [nzSpan]="18">
                              <div *ngFor="let fq of this.queryForm.fq; let i = index">
                                  <input [(ngModel)]="fq.val" nz-input style="width:80%" name="fq" [ngModelOptions]="{standalone: true}"/>
                                  <i nz-icon nzType="minus-circle-o" class="dynamic-delete-button" (click)="removeFqField(fq, $event)"></i>
                              </div>
                          </nz-form-control>
                      </nz-form-item>
                      <nz-form-item>
                          <nz-form-label [nzSpan]="6" [nzNoColon]="true"></nz-form-label>
                          <nz-form-control [nzSpan]="18">
                              <button nz-button nzType="dashed" class="add-button" (click)="addFqField($event)">
                                  <i nz-icon nzType="plus"></i>
                                  Add
                              </button>
                          </nz-form-control>
                      </nz-form-item>
                  </div>
              </div>
              <p style="margin-top:10px">
                  <nz-input-group nzCompact>
                      <button nz-button nzType="primary" (click)="startQuery()"><i nz-icon nzType="search" nzTheme="outline"></i>Query</button>
                      <button nz-button *ngIf="resultCount>0" (click)="addQueryTag()"><i nz-icon nzType="tags" nzTheme="outline"></i><span>命中:{{resultCount}}</span></button>
                      <a class="collapse" (click)="toggleCollapse()">
                          高级
                          <i nz-icon [nzType]="!this.queryForm.advanceQuery ? 'down' : 'up'"></i>
                      </a>
                  </nz-input-group>
              </p>
          </fieldset>
      </form>
      <nz-table #datalist [nzData]="queryResultList" [nzShowPagination]="false">
          <tbody>
          <tr *ngFor="let row of datalist.data">
              <td>
                  <nz-tag [nzColor]="'purple'">{{row.server}}</nz-tag>
                  <tis-query-result-row-content [content]="row.rowContent"></tis-query-result-row-content>
              </td>
          </tr>
          </tbody>
      </nz-table>
      <nz-modal
              [(nzVisible)]="addTagDialogVisible"
              nzTitle="设置查询标签"
              nzOkText="添加"
              nzCancelText="取消"
              (nzOnOk)="addTagDialogOK()"
              (nzOnCancel)="addTagDialogCancel()"
      >
          <form nz-form [formGroup]="tagAddForm" class="login-form" (ngSubmit)="submitTagForm()">
              <nz-form-item>
                  <nz-form-control nzErrorTip="请设置标签名">
                      <nz-input-group nzPrefixIcon="tag">
                          <input type="text" nz-input formControlName="tagName"/>
                      </nz-input-group>
                  </nz-form-control>
              </nz-form-item>
          </form>
      </nz-modal>
  `,
  styles: [`
      .dynamic-delete-button {
          cursor: pointer;
          position: relative;
          top: 4px;
          font-size: 24px;
          color: #999;
          transition: all 0.3s;
      }

      .dynamic-delete-button:hover {
          color: #777;
      }

      .ant-advanced-search-form {
          padding: 10px;
          background: #fbfbfb;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          margin-bottom: 10px;
          clear: both;
      }

      .search-query-item {
          margin-bottom: 1px;
      }

      [nz-form-label] {
          overflow: visible;
      }

      .leader-node {
          font-weight: bold;
      }

      .form-row {
          margin-bottom: 8px;
          margin-top: 8px;
      }

      .title-label {
          display: inline-block;
          margin-right: 1em;
          text-align: right;
          width: 4em;
      }

      .cols-block {
          padding: 0px;
          margin: 0px;
      }

      .cols-block li {
          list-style: none;
          display: inline-block;
          width: 200px;
      }
  `]
})
export class IndexQueryComponent extends BasicFormComponent implements OnInit {
  public resultCount = 0;
  queryResultList: { server: string, rowContent: string }[];
  queryForm = new IndexQueryForm();
  querySelectServerCandiate: Array<{ key: string, value: Array<{ checked: boolean, leader: boolean, ip: string, ipAddress: string }> }> = [];

  addTagDialogVisible = false;
  tagAddForm: FormGroup;
  private _localStoreTags: Array<TagQueryForm>;

  constructor(tisService: TISService, modalService: NgbModal, private fb: FormBuilder, private _localStorageService: LocalStorageService) {
    super(tisService, modalService);
  }

  openPOJOView() {
    this.openNormalDialog(PojoComponent);
  }

  ngOnInit(): void {

    this.tagAddForm = this.fb.group({
      tagName: [null, [Validators.required, Validators.maxLength(8), Validators.minLength(2)]]
    });

    let url = `/runtime/index_query.ajax`;
    this.httpPost(url, 'action=index_query_action&event_submit_do_get_server_nodes=y')
      .then((r: TisResponseResult) => {
        let groupNodes = r.bizresult.nodes;
        let cols = r.bizresult.fields;
        for (let key in groupNodes) {
          this.querySelectServerCandiate.push({'key': key, 'value': groupNodes[key]});
          if (cols) {
            cols.forEach((c: string) => {
              this.queryForm.cols.push({name: c, checked: false});
            });
          }
        }
      });
  }

  addQueryTag() {
    this.addTagDialogVisible = true;
  }

  startQuery() {
    let url = `/runtime/index_query.ajax?action=index_query_action&event_submit_do_query=y&resulthandler=exec_null&appname=${this.tisService.currentApp.appName}&${this.queryForm.toParams()}`;
    this.jsonp(url).then((result) => {
      //  console.log(result.bizresult);
      this.resultCallback(result.bizresult);
      this.queryResultList = result.bizresult.result;
    });
  }

  get codeMirrirOpts(): EditorConfiguration {
    return {
      mode: 'solr',
      lineNumbers: false,
      placeholder: 'solr query param'
    };
  }

  // private appendMessage(json: any) {
  //
  //   $("#messagebox").show('slow', function () {
  //   });
  //
  //   for (let i = 0; i < json.result.length; i++) {
  //     let row = json.result[i];
  //     let tr = $('<tr></tr>');
  //     tr.append($("<td width='5%'>" + row.server + '</td>'));
  //
  //     let content =
  //       $("<td style='position:relative;word-break:break-all;'><a href='#' explainid='" + row.pk + "' style='display:none;' onclick='return openExplain(this)'>explain</a>" + row.rowContent + "</td>");
  //
  //     tr.append(content);
  //     $("#messagebox").append(tr);
  //   }
  // }

  private resultCallback(data: any) {

    // this.appendMessage(data);
    this.setresultcount(data.rownum);
  }

  setresultcount(count: number) {
    if (count < this.resultCount) {
      return;
    }
    this.resultCount = count;
    // $("#resultcount").html("命中:" + resultCount);
  }

  // public get queryURL(): string {
  //   return '/query-index?appname=' + this.tisService.currentApp.appName;
  // }
  selectAllServerNodes() {
    this.setSelectAllServerNodes(true);
  }

  private setSelectAllServerNodes(checked: boolean) {
    this.querySelectServerCandiate.forEach((group) => {
      group.value.forEach((server) => {
        server.checked = checked;
      });
    });
  }

  unSelectAllServerNodes() {
    this.setSelectAllServerNodes(false);
  }

  setSelectableCols(checked: boolean) {
    this.queryForm.cols.forEach((c) => {
      c.checked = checked;
    });
  }

  get localStoreTags(): Array<TagQueryForm> {
    if (this._localStoreTags) {
      return this._localStoreTags;
    }
    this._localStoreTags = this._localStorageService.get(LocalStoreTags);
    if (this._localStoreTags && this._localStoreTags.length) {
      return this._localStoreTags;
    } else {
      this._localStoreTags = [];
      // this._localStorageService.set(LocalStoreTags, tags);
      return this._localStoreTags;
    }
  }

  refreshLocalStoreTags(): void {
    this._localStoreTags = null;
    let o = this.localStoreTags;
  }

  addQueryFormTag(tag: string, form: IndexQueryForm): void {
    let tags = this.localStoreTags;
    tags.push(new TagQueryForm(tag, form));
    this._localStorageService.set(LocalStoreTags, tags);
   // this.refreshLocalStoreTags();
  }

  deleteQueryFormTag(tagName: string) {
    let tags = this.localStoreTags;

    let index = tags.findIndex((t) => t.tagName === tagName);
    // console.log(tagName + ",index:" + index);
    if (index > -1) {
      // tags =
      tags.splice(index, 1);
      // console.log(tags);
      this._localStorageService.set(LocalStoreTags, tags);
     // this.refreshLocalStoreTags();
    }
  }

  addTagDialogOK() {
    this.addTagDialogVisible = !this.submitTagForm();
    // this.addTagDialogVisible = false;
    let tagname: AbstractControl = this.tagAddForm.controls["tagName"];

    this.addQueryFormTag(tagname.value, this.queryForm);
  }

  addTagDialogCancel() {
    this.addTagDialogVisible = false;
  }

  submitTagForm(): boolean {
    for (const i in this.tagAddForm.controls) {
      this.tagAddForm.controls[i].markAsDirty();
      this.tagAddForm.controls[i].updateValueAndValidity();
    }
    return this.tagAddForm.valid;
  }

  addFqField(event: MouseEvent) {
    this.queryForm.fq.push(new FilterQuery());
  }

  removeFqField(control: FilterQuery, event: MouseEvent) {
    if (this.queryForm.fq.length > 1) {
      let indexof = this.queryForm.fq.indexOf(control);
      this.queryForm.fq.splice(indexof, 1);
    } else {
      control.val = undefined;
    }
  }

  toggleCollapse() {
    this.queryForm.advanceQuery = !this.queryForm.advanceQuery;
  }

  queryFormTagClick(tag: string) {
    // let tagForm = this.localStoreTags.get(tag);

    let tagForm = this.localStoreTags.find((t) => t.tagName === tag);
    if (tagForm) {
      this.queryForm = Object.assign(new IndexQueryForm(), tagForm.form);
      let fq: FilterQuery[] = this.queryForm.fq;
      if (fq && fq.length > 0) {
        this.queryForm.fq = [];
        fq.forEach((f) => {
          this.queryForm.fq.push(Object.assign(new FilterQuery(), f));
        });
      }

      let facet: FacetQuery = this.queryForm.facet;
      if (facet) {
        this.queryForm.facet = Object.assign(new FacetQuery(), facet);
      }
    }
    console.log(this.queryForm);
  }
}

@Component({
  selector: 'tis-query-result-row-content',
  template: `
  `
})
export class QueryResultRowContentComponent {
  constructor(private c: ViewContainerRef) {
  }

  @Input() set content(content: any) {
    $(this.c.element.nativeElement).html(content);
  }
}

class IndexQueryForm {
  q = "*:*";
  sort: string;
  fq: FilterQuery[] = [new FilterQuery()];
  start = 0;
  shownum = 3;
  // pageNo: number;
  // sfields: string[];
  debug: boolean;
  rawParams: string;
  distrib: boolean;
  advanceQuery = false;
  cols: Array<{ checked: boolean, name: string }> = [];

  facet: FacetQuery = new FacetQuery();

  public toParams(): string {
    let params = this.parseParams(this, new HttpParams());
    let result = params.toString();
    // console.log(result);
    return result;
  }

  private parseParams(targetObj: any, params: HttpParams): HttpParams {
    // let params = new HttpParams();
    // let result = '';

    let value = null;
    let arrayVal: Array<any>;
    for (let x in targetObj) {
      value = targetObj[x];
      // console.log(`typeof key:${x} val:${value} ${typeof value === 'number'}`);
      if (value === undefined || value === null) {
        continue;
      }
      if (typeof value === 'function') {
        continue;
      }
      if (typeof value === "string" || typeof value === "number" || typeof value === 'boolean') {
        //   result += "&" + x + "=" +
        params = params.append(x, `${value}`);
        // console.log(params);
      } else if (value instanceof Array && 'cols' === x) {
        let val = null;
        for (let e in value) {
          val = value[e];
          if (val === undefined) {
            continue;
          }
          if (val.checked) {
            params = params.append('sfields', `${val.name}`);
          }
        }
      } else if (value instanceof Array) {
        arrayVal = value;
        let val = null;
        for (let e in arrayVal) {
          val = arrayVal[e].val;
          if (val === undefined) {
            continue;
          }
          params = params.append(x, `${val}`);
        }
      } else if (value instanceof FacetQuery) {
        params = this.parseParams(value, params);
      } else {
        throw new Error(`key:${x},value: ${value} is illegal`);
      }
    }
    return params;
  }
}

class TagQueryForm {
  tagName: string;
  form: IndexQueryForm

  constructor(tagName: string, form: IndexQueryForm) {
    this.tagName = tagName;
    this.form = form;
  }
}

class FacetQuery {
  facet = false;
  facetQuery: string;
  facetField: string;
  facetPrefix: string;
}

class FilterQuery {
  val: string;
}
