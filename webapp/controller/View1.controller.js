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

			/// SET PANEL LAYOUTS
			var l1 = new sap.ui.layout.SplitterLayoutData({
				size: "40%"
			});
			this.getView().byId("networkPanel").setLayoutData(l1);
			var l2 = new sap.ui.layout.SplitterLayoutData({
				size: "60%"
			});
			this.getView().byId("viewerPanel").setLayoutData(l2);
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
				vsm.enumerateSelection(this.clearSelection.bind(this));
			}
		},

		selectViewerNode: function(key) {
			var vsmId = this.getView().byId("viewport").getViewStateManager();
			var vsm = sap.ui.getCore().byId(vsmId);
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
			vsm.setSelectionState(id, false, true);
		}
	});
});