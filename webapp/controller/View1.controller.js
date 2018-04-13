sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/suite/ui/commons/networkgraph/layout/LayeredLayout",
	"sap/suite/ui/commons/networkgraph/layout/ForceBasedLayout",
	"sap/suite/ui/commons/networkgraph/ActionButton",
	"sap/suite/ui/commons/networkgraph/Node",
	"sap/suite/ui/commons/library",
	"sap/ui/vk/ContentResource",
	"sap/ui/vk/ContentConnector",
	"sap/ui/vk/dvl/ViewStateManager",
	"sap/m/MessageToast"
], function(Controller) {
	"use strict";

	return Controller.extend("com.gv.nge.NetworkGraphEqui.controller.View1", {
		STARTING_PROFILE: "9878787",
		onInit: function() {
			this._oModel = new sap.ui.model.json.JSONModel("data/graph.json");
			this._oModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);

			this._sTopParent = this.STARTING_PROFILE;
			this._mExplored = [this._sTopParent];

			this._graph = this.getView().byId("graph");
			this.getView().setModel(this._oModel);

			this._setFilter();

			this._graph.attachEvent("beforeLayouting", function(oEvent) {
				// nodes are not rendered yet (bOutput === false) so their invalidation triggers parent (graph) invalidation
				// which results in multiple unnecessary loading
				this._graph.preventInvalidation(true);
				this._graph.getNodes().forEach(function(oNode) {

					oNode.attachPress(this.onNodePress, this);

					var oExpandButton, oDetailButton, oUpOneLevelButton,
						sIsParent = this._getCustomDataValue(oNode, "is-parent"),
						sParent;

					oNode.removeAllActionButtons();

					if (!sIsParent) {
						// employees without team - hide expand buttons
						oNode.setShowExpandButton(false);
					} else {
						if (this._mExplored.indexOf(oNode.getKey()) === -1) {

							// managers with team but not yet expanded
							// we create custom expand button with dynamic loading
							oNode.setShowExpandButton(false);

							// this renders icon marking collapse status
							oNode.setCollapsed(true);
							oExpandButton = new sap.suite.ui.commons.networkgraph.ActionButton({
								title: "Expand",
								icon: "sap-icon://sys-add",
								press: function() {
									oNode.setCollapsed(false);
									this._loadMore(oNode.getKey());
								}.bind(this)
							});
							oNode.addActionButton(oExpandButton);
						} else {
							// manager with already loaded data - default expand button
							oNode.setShowExpandButton(true);
						}
					}

					// add detail link -> custom popover
					oDetailButton = new sap.suite.ui.commons.networkgraph.ActionButton({
						title: "Detail",
						icon: "sap-icon://hint",
						press: function(oEvent) {
							this._openDetail(oNode, oEvent.getParameter("buttonElement"));
						}.bind(this)
					});
					oNode.addActionButton(oDetailButton);

					// if current user is root we can add 'up one level'
					if (oNode.getKey() === this._sTopParent) {
						sParent = this._getCustomDataValue(oNode, "parent");
						if (sParent) {
							oUpOneLevelButton = new sap.suite.ui.commons.networkgraph.ActionButton({
								title: "Up one level",
								icon: "sap-icon://arrow-top",
								press: function() {
									var aSuperVisors = oNode.getCustomData().filter(function(oData) {
											return oData.getKey() === "parent";
										}),
										sParent = aSuperVisors.length > 0 && aSuperVisors[0].getValue();

									this._loadMore(sParent);
									this._sTopParent = sParent;
								}.bind(this)
							});
							oNode.addActionButton(oUpOneLevelButton);
						}
					}
				}, this);
				this._graph.preventInvalidation(false);
			}.bind(this));

			// VIEWER CON 3 COMPONENTI SEPARATE
			//viewer
			var view = this.getView();
			var oViewport = view.byId("viewport");
			var sceneTree = view.byId("scenetree");
			var stepNavigation = view.byId("stepnavigation");

			var contentResource = new sap.ui.vk.ContentResource({
				source: "data/9582900275.vds",
				sourceType: "vds",
				sourceId: "abc123"
			});
			//Constructor for a new content connector
			var contentConnector = new sap.ui.vk.ContentConnector("abcd");

			//Manages the visibility and the selection states of nodes in the scene.
			var viewStateManager = new sap.ui.vk.ViewStateManager("vsmA", {
				contentConnector: contentConnector
			});

			//set content connector and viewStateManager for viewport
			oViewport.setContentConnector(contentConnector);
			oViewport.setViewStateManager(viewStateManager);

			// Set contentconnector and viewstatemanager for scene tree
			sceneTree.setContentConnector(contentConnector);
			sceneTree.setViewStateManager(viewStateManager);

			//set step navigation content connector
			stepNavigation.setContentConnector(contentConnector);

			view.addDependent(contentConnector).addDependent(viewStateManager);

			//Add resource to load to content connector
			contentConnector.addContentResource(contentResource);

			// COMPONENTE VIEWER UNICA
			/*var viewer = this.getView().byId("viewer");
			var contentResource = new sap.ui.vk.ContentResource({
				source: "data/9582900275.vds",
				sourceType: "vds",
				sourceId: "abc123"
			});
			viewer.addContentResource(contentResource);
			viewer.setShowSceneTree(false);*/

			/// SET PANEL LAYOUTS
			/*var l1 = new sap.ui.layout.SplitterLayoutData({
				size: "30%"
			});
			this.getView().byId("masterPanel").setLayoutData(l1);
			
			
			var h1 = new sap.ui.layout.SplitterLayoutData({
				size: "50%"
			});
			this.getView().byId("networkPanel").setLayoutData(h1);
			var h2 = new sap.ui.layout.SplitterLayoutData({
				size: "50%"
			});
			this.getView().byId("viewerPanel").setLayoutData(h2);*/

			/*var toolbarHeight = new sap.ui.layout.SplitterLayoutData({
				size: "100px",
				resizable: false
			});
			this.getView().byId("toolbarPanel").setLayoutData(toolbarHeight);

			var viewerHeight = new sap.ui.layout.SplitterLayoutData({
				resizable: false
			});
			this.getView().byId("viewerPanel").setLayoutData(viewerHeight);

			var testHeight = new sap.ui.layout.SplitterLayoutData({
				size: "0px",
				resizable: false
			});
			this.getView().byId("test").setLayoutData(testHeight);*/

			// Gestione dati masterlist
			//var oModel = new sap.ui.model.json.JSONModel("data/masterList.json");//jQuery.sap.getModulePath("sap.ui.demo.mock", "/products.json"));
			//this.getView().setModel(oModel);
			this._mModel = new sap.ui.model.json.JSONModel("data/masterList.json");

			this._mModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
			this.getView().byId("masterList").setModel(this._mModel);

			// SplitButton
			this.getView().byId("segButton").attachSelectionChange(this.switchSubView, this);

			// DATI CALENDAR
			this._cModel = new sap.ui.model.json.JSONModel();
			this._cModel.setData({
				startDate: new Date("2017", "0", "08", "8", "0"),
				people: [{
					name: "John Miller",
					appointments: [{
						start: new Date("2016", "10", "15", "10", "0"),
						end: new Date("2016", "11", "25", "12", "0"),
						title: "Team collaboration",
						info: "room 1",
						type: "Type01",
						pic: "sap-icon://sap-ui5",
						tentative: false
					}, {
						start: new Date("2016", "09", "13", "9", "0"),
						end: new Date("2016", "01", "09", "10", "0"),
						title: "Reminder",
						type: "Type06"
					}, {
						start: new Date("2016", "07", "10", "0", "0"),
						end: new Date("2016", "09", "16", "23", "59"),
						title: "Vacation",
						info: "out of office",
						type: "Type04",
						tentative: false
					}, {
						start: new Date("2016", "07", "1", "0", "0"),
						end: new Date("2016", "09", "31", "23", "59"),
						title: "New quarter",
						type: "Type10",
						tentative: false
					}, {
						start: new Date("2017", "0", "03", "0", "01"),
						end: new Date("2017", "0", "04", "23", "59"),
						title: "Workshop",
						info: "regular",
						type: "Type07",
						pic: "sap-icon://sap-ui5",
						tentative: false
					}, {
						start: new Date("2017", "0", "05", "08", "30"),
						end: new Date("2017", "0", "05", "09", "30"),
						title: "Meet Donna Moore",
						type: "Type02",
						tentative: false
					}, {
						start: new Date("2017", "0", "08", "10", "0"),
						end: new Date("2017", "0", "08", "12", "0"),
						title: "Team meeting",
						info: "room 1",
						type: "Type01",
						pic: "sap-icon://sap-ui5",
						tentative: false
					}, {
						start: new Date("2017", "0", "09", "0", "0"),
						end: new Date("2017", "0", "09", "23", "59"),
						title: "Vacation",
						info: "out of office",
						type: "Type02",
						tentative: false
					}, {
						start: new Date("2017", "0", "11", "0", "0"),
						end: new Date("2017", "0", "12", "23", "59"),
						title: "Education",
						info: "",
						type: "Type03",
						tentative: false
					}, {
						start: new Date("2017", "0", "16", "00", "30"),
						end: new Date("2017", "0", "16", "23", "30"),
						title: "New Product",
						info: "room 105",
						type: "Type04",
						tentative: true
					}, {
						start: new Date("2017", "0", "18", "11", "30"),
						end: new Date("2017", "0", "18", "13", "30"),
						title: "Lunch",
						info: "canteen",
						type: "Type03",
						tentative: true
					}, {
						start: new Date("2017", "0", "20", "11", "30"),
						end: new Date("2017", "0", "20", "13", "30"),
						title: "Lunch",
						info: "canteen",
						type: "Type03",
						tentative: true
					}, {
						start: new Date("2017", "0", "18", "0", "01"),
						end: new Date("2017", "0", "19", "23", "59"),
						title: "Working out of the building",
						type: "Type07",
						pic: "sap-icon://sap-ui5",
						tentative: false
					}, {
						start: new Date("2017", "0", "23", "08", "00"),
						end: new Date("2017", "0", "24", "18", "30"),
						title: "Discussion of the plan",
						info: "Online meeting",
						type: "Type04",
						tentative: false
					}, {
						start: new Date("2017", "0", "25", "0", "01"),
						end: new Date("2017", "0", "26", "23", "59"),
						title: "Workshop",
						info: "regular",
						type: "Type07",
						pic: "sap-icon://sap-ui5",
						tentative: false
					}, {
						start: new Date("2017", "2", "30", "10", "0"),
						end: new Date("2017", "4", "33", "12", "0"),
						title: "Working out of the building",
						type: "Type07",
						pic: "sap-icon://sap-ui5",
						tentative: false
					}, {
						start: new Date("2017", "8", "1", "00", "30"),
						end: new Date("2017", "10", "15", "23", "30"),
						title: "Development of a new Product",
						info: "room 207",
						type: "Type03",
						tentative: true
					}, {
						start: new Date("2017", "1", "15", "10", "0"),
						end: new Date("2017", "2", "25", "12", "0"),
						title: "Team collaboration",
						info: "room 1",
						type: "Type01",
						pic: "sap-icon://sap-ui5",
						tentative: false
					}, {
						start: new Date("2017", "2", "13", "9", "0"),
						end: new Date("2017", "3", "09", "10", "0"),
						title: "Reminder",
						type: "Type06"
					}, {
						start: new Date("2017", "03", "10", "0", "0"),
						end: new Date("2017", "05", "16", "23", "59"),
						title: "Vacation",
						info: "out of office",
						type: "Type04",
						tentative: false
					}, {
						start: new Date("2017", "07", "1", "0", "0"),
						end: new Date("2017", "09", "31", "23", "59"),
						title: "New quarter",
						type: "Type10",
						tentative: false
					}],
					headers: [{
						start: new Date("2017", "0", "08", "0", "0"),
						end: new Date("2017", "0", "08", "23", "59"),
						title: "National holiday",
						type: "Type04"
					}, {
						start: new Date("2017", "0", "10", "0", "0"),
						end: new Date("2017", "0", "10", "23", "59"),
						title: "Birthday",
						type: "Type06"
					}, {
						start: new Date("2017", "0", "17", "0", "0"),
						end: new Date("2017", "0", "17", "23", "59"),
						title: "Reminder",
						type: "Type06"
					}]
				}]
			});
			this.getView().byId("calendar").setModel(this._cModel);

			var oPanel = this.getView().byId("calendarPanel");
			oPanel.setVisible(false);
		},

		search: function(oEvent) {
			var sKey = oEvent.getParameter("key");
			if (sKey) {
				this._mExplored = [sKey];
				this._sTopParent = sKey;
				this._graph.destroyAllElements();
				this._setFilter();
				oEvent.bPreventDefault = true;
			}
		},

		suggest: function(oEvent) {
			var aSuggestionItems = [],
				aItems = this._oModel.getData().nodes,
				aFilteredItems = [],
				sTerm = oEvent.getParameter("term");
			sTerm = sTerm ? sTerm : "";
			aFilteredItems = aItems.filter(function(oItem) {
				var sTitle = oItem.title ? oItem.title : "";
				return sTitle.toLowerCase().indexOf(sTerm.toLowerCase()) !== -1;
			});
			aFilteredItems.sort(function(oItem1, oItem2) {
				var sTitle = oItem1.title ? oItem1.title : "";
				return sTitle.localeCompare(oItem2.title);
			}).forEach(function(oItem) {
				aSuggestionItems.push(new sap.m.SuggestionItem({
					key: oItem.id,
					text: oItem.title
				}));
			});
			this._graph.setSearchSuggestionItems(aSuggestionItems);
			oEvent.bPreventDefault = true;
		},

		onExit: function() {
			if (this._oQuickView) {
				this._oQuickView.destroy();
			}
		},

		_setFilter: function() {
			var aNodesCond = [],
				aLinesCond = [];
			var fnAddBossCondition = function(sBoss) {
				aNodesCond.push(new sap.ui.model.Filter({
					path: 'id',
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sBoss
				}));
				aNodesCond.push(new sap.ui.model.Filter({
					path: 'parent',
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sBoss
				}));
			};
			var fnAddLineCondition = function(sLine) {
				aLinesCond.push(new sap.ui.model.Filter({
					path: "from",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sLine
				}));
			};
			this._mExplored.forEach(function(oItem) {
				fnAddBossCondition(oItem);
				fnAddLineCondition(oItem);
			});
			this._graph.getBinding("nodes").filter(new sap.ui.model.Filter({
				filters: aNodesCond,
				and: false
			}));
			this._graph.getBinding("lines").filter(new sap.ui.model.Filter({
				filters: aLinesCond,
				and: false
			}));
		},

		_loadMore: function(sName) {
			this._graph.deselect();
			this._mExplored.push(sName);
			this._graph.destroyAllElements();
			this._setFilter();
		},

		_getCustomDataValue: function(oNode, sName) {
			var aItems = oNode.getCustomData().filter(function(oData) {
				return oData.getKey() === sName;
			});
			return aItems.length > 0 && aItems[0].getValue();
		},

		_openDetail: function(oNode, oButton) {
			if (!this._oQuickView) {
				this._oQuickView = sap.ui.xmlfragment("com.gv.nge.NetworkGraphEqui.view.Details", this);
			}
			this._oQuickView.setModel(new sap.ui.model.json.JSONModel({
				icon: oNode.getImage() && oNode.getImage().getProperty("src"),
				title: oNode.getDescription(),
				location: this._getCustomDataValue(oNode, "location"),
				itemDescription: this._getCustomDataValue(oNode, "description"),
				productionPlant: this._getCustomDataValue(oNode, "production-plant"),
				purchasePrice: this._getCustomDataValue(oNode, "purchase-price"),
				estimatedTol: this._getCustomDataValue(oNode, "estimated-tol"),
				status: this._getCustomDataValue(oNode, "status"),
				temperature: this._getCustomDataValue(oNode, "temperature")
			}));
			jQuery.sap.delayedCall(0, this, function() {
				this._oQuickView.openBy(oButton);
			});
		},

		linePress: function(oEvent) {
			oEvent.bPreventDefault = true;
		},

		onNodePress: function(oEvent) {
			var key = oEvent.getSource().getKey();
			var selected = oEvent.getSource().getSelected();
			if (!selected) {
				this.selectViewerNode(key);
			} else {
				var vsmId = this.getView().byId("viewport").getViewStateManager();
				var vsm = sap.ui.getCore().byId(vsmId);
				//var vsm = this.getView().byId("viewer").getViewStateManager();
				vsm.enumerateSelection(this.clearSelection.bind(this));
			}
		},

		selectViewerNode: function(key) {
			var vsmId = this.getView().byId("viewport").getViewStateManager();
			var vsm = sap.ui.getCore().byId(vsmId);
			//var vsm = this.getView().byId("viewer").getViewStateManager();
			var nh = vsm.getNodeHierarchy();
			vsm.enumerateSelection(this.clearSelection.bind(this));

			// Solo per sviluppo
			var mockMapping = {
				"9878787": "9582900275_CORPO_VALVOLA_ASPIRAZIONE",
				"9767676": "9582900275_CILINDRO_VALVOLA_ASPIRAZIONE",
				"8434343": "9582900275_ASTA_VALVOLA_ASPIRAZIONE",
				"7565656": "9310110782",
				"4121212": "VITI"
			};
			var name = mockMapping[key];

			var query = {
				value: name,
				caseSensitive: false,
				predicate: "contains"
			};
			var node = nh.findNodesByName(query);
			vsm.setSelectionState(node, true, true);
		},

		clearSelection: function(id) {
			var vsmId = this.getView().byId("viewport").getViewStateManager();
			var vsm = sap.ui.getCore().byId(vsmId);
			//var vsm = this.getView().byId("viewer").getViewStateManager();
			vsm.setSelectionState(id, false, true);
		},

		onListItemPress: function(evt) {
			sap.m.MessageToast.show("Pressed : " + evt.getSource().getTitle());
		},

		switchSubView: function(oEvent) {
			var key = oEvent.getSource().getSelectedKey();

			if (key === "calend") {
				var oPanel = this.getView().byId("calendarPanel");
				oPanel.setVisible(true);
				var oPanel2 = this.getView().byId("viewerPanel");
				oPanel2.setVisible(false);
			} else if (key === "v3d") {
				var oPanel = this.getView().byId("calendarPanel");
				oPanel.setVisible(false);
				var oPanel2 = this.getView().byId("viewerPanel");
				oPanel2.setVisible(true);
			}
		},

			handleAppointmentSelect: function (oEvent) {
				var oAppointment = oEvent.getParameter("appointment");
				if (oAppointment) {
					sap.m.MessageBox.show("Appointment selected: " + oAppointment.getTitle());
				} else {
					var aAppointments = oEvent.getParameter("appointments");
					var sValue = aAppointments.length + " Appointments selected";
					sap.m.MessageBox.show(sValue);
				}
			},

			handleIntervalSelect: function (oEvent) {
				var oStartDate = oEvent.getParameter("startDate");
				var oEndDate = oEvent.getParameter("endDate");
				var oModel = this.getView().getModel();
				var oData = oModel.getData();
				var oAppointment = {
					start: oStartDate,
					end: oEndDate,
					title: "new appointment",
					type: "Type09"
				};

				oData.people[0].appointments.push(oAppointment);
				oModel.setData(oData);
			},

			toggleDayNamesLine: function (oEvent) {
				var oPC = this.getView().byId("calendar");
				oPC.setShowDayNamesLine(!oPC.getShowDayNamesLine());
			}

	});
});