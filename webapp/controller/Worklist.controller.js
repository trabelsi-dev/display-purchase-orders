sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"mycompany/myapp/MyWorklistApp/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	'sap/ui/export/library',
	'sap/ui/export/Spreadsheet',
	'sap/ui/core/util/Export',
	'sap/ui/core/util/ExportTypeCSV',

], function (BaseController, JSONModel, formatter, Filter, FilterOperator, MessageToast, MessageBox, exportLibrary, Spreadsheet,Export,ExportTypeCSV) {
	"use strict";

	 var EdmType = exportLibrary.EdmType;
	 var nameFile = 'all Orders';

	 return BaseController.extend("mycompany.myapp.MyWorklistApp.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

				// export 
				var oModel = new sap.ui.model.json.JSONModel("../localService/mockdata/ZORDER_STRUCTURESet.json");
				sap.ui.getCore().setModel(oModel, "oModel");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			this._oTable = oTable;
			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0,
				offre: 0,
				contrat: 0,
				commande:0,
				livraison: 0,
				countAll: 0
			});
			this.setModel(oViewModel, "worklistView");
			// Create an object of filters
			this._mFilters = {
				"offre":     [new Filter("Bstyp", FilterOperator.EQ, 'A')],
				"contrat":   [new Filter("Bstyp", FilterOperator.EQ, 'K')],
				"commande":  [new Filter("Bstyp", FilterOperator.EQ, 'F')],
				"livraison": [new Filter("Bstyp", FilterOperator.EQ, 'L')],
				"all":       []
			};

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function(){
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
		},

		createColumnConfig: function() {
			var aCols = [];

			aCols.push({
				property: 'Aedat',
				type: EdmType.String
			});

			aCols.push({
				property: 'Bsart',
				type: EdmType.String
			});

			aCols.push({
				property: 'Bstyp',
				type: EdmType.String
			});

			aCols.push({
				property: 'Ebeln',
				type: EdmType.String
			
			});
			aCols.push({
				property: 'Ernam',
				type: EdmType.String
			
			});
			aCols.push({
				property: 'Lifnr',
				type: EdmType.String
			
			});
			aCols.push({
				property: 'Name1',
				type: EdmType.String
			
			});
			aCols.push({
				property: 'Procstat',
				type: EdmType.String
			
			});
				aCols.push({
				property: 'Spras',
				type: EdmType.String
			
			});

			return aCols;
		},

		onExport: function() {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this._oTable) {
				this._oTable = this.byId('table');
			}
		  	oTable = this._oTable;
			  oRowBinding = oTable.getBinding('items');
		  	aCols = this.createColumnConfig();
 
			oSettings = {
				workbook: {
					columns: aCols,
					hierarchyLevel: 'Level'
				},
				dataSource: oRowBinding,
				fileName: nameFile+'.xlsx',
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function() {
				oSheet.destroy();
			});
		},



		
		// fin export

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished : function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				oViewModel = this.getModel("worklistView"),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
				// Get the count for all the orders and set the value to 'countAll' property
				this.getModel().read("/ZORDER_STRUCTURESet/$count", {
					success: function (oData) {
						oViewModel.setProperty("/countAll", oData);
					}
				});
				// read the count for the offre filter
				this.getModel().read("/ZORDER_STRUCTURESet/$count", {
					success: function (oData) {
						oViewModel.setProperty("/offre", oData);
					},
					filters: this._mFilters.offre
				});
				// read the count for the contrat filter
				this.getModel().read("/ZORDER_STRUCTURESet/$count", {
					success: function(oData){
						oViewModel.setProperty("/contrat", oData);
					},
					filters: this._mFilters.contrat
				});
				// read the count for the commande filter
				this.getModel().read("/ZORDER_STRUCTURESet/$count", {
					success: function(oData){
						oViewModel.setProperty("/commande", oData);
					},
					filters: this._mFilters.commande
				});
					// read the count for the livraison filter
					this.getModel().read("/ZORDER_STRUCTURESet/$count", {
						success: function(oData){
							oViewModel.setProperty("/livraison", oData);
						},
						filters: this._mFilters.livraison
					});
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress : function (oEvent) {
		
			// The source is the list item that got pressed
		 this._showObject(oEvent.getSource());
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser history
		 * @public
		 */
		onNavBack : function() {
			history.go(-1);
		},



		onFilterPosts: function (oEvent) {

			// build filter array
			var aFilter = [];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				aFilter.push(
					new Filter({
						filters: [
							new Filter("Ebeln", FilterOperator.Contains, sQuery),
							new Filter("Lifnr", FilterOperator.Contains, sQuery),
							new Filter("Name1", FilterOperator.Contains, sQuery),
							new Filter("Bukrs", FilterOperator.Contains, sQuery),
							new Filter("Spras", FilterOperator.Contains, sQuery),
						],
						and: false,
					})
				);
			}

			// filter binding
			var oTable = this.byId("table");
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilter);
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh : function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
	
		_showObject : function (oItem) {	
				this.getRouter().navTo("object", {
							objectId: oItem.getBindingContext().getProperty("Ebeln")
				});
		

		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function(aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},

		/**
		 * Displays an error message dialog. The displayed dialog is content density aware.
		 * @param {string} sMsg The error message to be displayed
		 * @private
		 */
		_showErrorMessage: function(sMsg) {
			MessageBox.error(sMsg, {
				styleClass: this.getOwnerComponent().getContentDensityClass()
			});
		},

		/**
		 * Event handler when a filter tab gets pressed
		 * @param {sap.ui.base.Event} oEvent the filter tab event
		 * @public
		 */
		
		onQuickFilter: function(oEvent) {
			var oBinding = this._oTable.getBinding("items"),
				  sKey = oEvent.getParameter("selectedKey");
					nameFile = sKey;
			oBinding.filter(this._mFilters[sKey]);
			
		},

		/**
		 * Error and success handler for the unlist action.
		 * @param {string} sProductId the product ID for which this handler is called
		 * @param {boolean} bSuccess true in case of a success handler, else false (for error handler)
		 * @param {number} iRequestNumber the counter which specifies the position of this request
		 * @param {number} iTotalRequests the number of all requests sent
		 * @private
		 */

		_handleUnlistActionResult : function (sProductId, bSuccess, iRequestNumber, iTotalRequests){
			// we could create a counter for successful and one for failed requests
			// however, we just assume that every single request was successful and display a success message once
			if (iRequestNumber === iTotalRequests) {
				MessageToast.show(this.getModel("i18n").getResourceBundle().getText("StockRemovedSuccessMsg", [iTotalRequests]));
			}
		},

		/**
		 * Error and success handler for the reorder action.
		 * @param {string} sProductId the product ID for which this handler is called
		 * @param {boolean} bSuccess true in case of a success handler, else false (for error handler)
		 * @param {number} iRequestNumber the counter which specifies the position of this request
		 * @param {number} iTotalRequests the number of all requests sent
		 * @private
		 */

		_handleReorderActionResult : function (sProductId, bSuccess, iRequestNumber, iTotalRequests){
			// we could create a counter for successful and one for failed requests
			// however, we just assume that every single request was successful and display a success message once
			if (iRequestNumber === iTotalRequests) {
				MessageToast.show(this.getModel("i18n").getResourceBundle().getText("StockUpdatedSuccessMsg", [iTotalRequests]));
			}
		},

	});

});