YUI.add('widget-position-ext', function(Y) {

/**
 * Provides extended/advanced XY positioning support for Widgets, through an extension.
 *
 * It builds on top of the widget-position module, to provide alignmentment and centering support.
 * Future releases aim to add constrained and fixed positioning support.
 *
 * @module widget-position-ext
 */
        var L = Y.Lang,
            ALIGN = "align",

            BINDUI = "bindUI",
            SYNCUI = "syncUI",

            OFFSET_WIDTH = "offsetWidth",
            OFFSET_HEIGHT = "offsetHeight",
            VIEWPORT_REGION = "viewportRegion",
            REGION = "region",

            AlignChange = "alignChange";

        /**
         * Widget extension, which can be used to add extended XY positioning support to the base Widget class,
         * through the <a href="Base.html#method_build">Base.build</a> method. This extension requires that 
         * the WidgetPosition extension be added to the Widget (before WidgetPositionExt, if part of the same 
         * extension list passed to Base.build).
         *
         * @class WidgetPositionExt
         * @param {Object} User configuration object
         */
        function PositionExt(config) {
            if (!this._posNode) {
                Y.error("WidgetPosition needs to be added to the Widget, before WidgetPositionExt is added"); 
            }
            Y.after(this._syncUIPosExtras, this, SYNCUI);
            Y.after(this._bindUIPosExtras, this, BINDUI);
        }

        /**
         * Static property used to define the default attribute 
         * configuration introduced by WidgetPositionExt.
         * 
         * @property WidgetPositionExt.ATTRS
         * @type Object
         * @static
         */
        PositionExt.ATTRS = {

            /**
             * @attribute align
             * @type Object
             * @default null
             * @desciption The align attribute is used to align a reference point on the widget, with the refernce point on another node, or the viewport. 
             * The object which align expects has the following properties:
             * <dl>
             *       <dt>node</dt>
             *       <dd>
             *         The node to which the Widget is to be aligned. If set to null, or not provided, the Widget is aligned to the viewport
             *       </dd>
             *       <dt>points</dt>
             *       <dd>
             *         <p>
             *         A two element array, defining the two points on the Widget and node/viewport which are to be aligned. The first element is the point on the Widget, and the second element is the point on the node/viewport.
             *         Supported alignment points are defined as static properties on <code>WidgetPositionExt</code>.
             *         </p>
             *         <p>
             *         e.g. <code>[WidgetPositionExt.TR, WidgetPositionExt.TL]</code> aligns the Top-Right corner of the Widget with the
             *         Top-Left corner of the node/viewport, and <code>[WidgetPositionExt.CC, WidgetPositionExt.TC]</code> aligns the Center of the 
             *         Widget with the Top-Center edge of the node/viewport.
             *         </p>
             *       </dd>
             *   </dl>
             */
            align: {
                value:null
            },

            /**
             * @attribute centered
             * @type {boolean | node} 
             * @default false
             * @description A convenience attribute, which can be used as a shortcut for the align attribute.
             * If set to true, the Widget is centered in the viewport. If set to a node reference or valid selector string,
             * the Widget will be centered within the node. If set the false, no center positioning is applied.
             */
            centered: {
                setter: function(val) {
                    return this._setAlignCenter(val);
                },
                lazyAdd:false,
                value:false
            }
        };

        /**
         * Constant used to specify the top-left corner for alignment
         * 
         * @property WidgetPositionExt.TL
         * @type String
         * @static
         * @value "tl"
         */
        PositionExt.TL = "tl";
        /**
         * Constant used to specify the top-right corner for alignment
         * 
         * @property WidgetPositionExt.TR
         * @type String
         * @static
         * @value "tr"
         */
        PositionExt.TR = "tr";
        /**
         * Constant used to specify the bottom-left corner for alignment
         * 
         * @property WidgetPositionExt.BL
         * @type String
         * @static
         * @value "bl"
         */
        PositionExt.BL = "bl";
        /**
         * Constant used to specify the bottom-right corner for alignment
         * 
         * @property WidgetPositionExt.BR
         * @type String
         * @static
         * @value "br"
         */
        PositionExt.BR = "br";
        /**
         * Constant used to specify the top edge-center point for alignment
         * 
         * @property WidgetPositionExt.TC
         * @type String
         * @static
         * @value "tc"
         */
        PositionExt.TC = "tc";
        /**
         * Constant used to specify the right edge, center point for alignment
         * 
         * @property WidgetPositionExt.RC
         * @type String
         * @static
         * @value "rc"
         */
        PositionExt.RC = "rc";
        /**
         * Constant used to specify the bottom edge, center point for alignment
         * 
         * @property WidgetPositionExt.BC
         * @type String
         * @static
         * @value "bc"
         */
        PositionExt.BC = "bc";
        /**
         * Constant used to specify the left edge, center point for alignment
         * 
         * @property WidgetPositionExt.LC
         * @type String
         * @static
         * @value "lc"
         */
        PositionExt.LC = "lc";
        /**
         * Constant used to specify the center of widget/node/viewport for alignment
         * 
         * @property WidgetPositionExt.CC
         * @type String
         * @static
         * @value "cc"
         */
        PositionExt.CC = "cc";

        PositionExt.prototype = {

            /**
             * Synchronizes the UI to match the Widgets extended positioning state.
             * This method in invoked after syncUI is invoked for the Widget class
             * using YUI's aop infrastructure.
             *
             * @method _syncUIPosExtras
             * @protected
             */
            _syncUIPosExtras : function() {
                var align = this.get(ALIGN);
                if (align) {
                    this._uiSetAlign(align.node, align.points);
                }
            },

            /**
             * Binds event listeners responsible for updating the UI state in response to 
             * Widget extended positioning related state changes.
             * <p>
             * This method is invoked after bindUI is invoked for the Widget class
             * using YUI's aop infrastructure.
             * </p>
             * @method _bindUIStack
             * @protected
             */
            _bindUIPosExtras : function() {
                this.after(AlignChange, this._afterAlignChange);
            },

            /**
             * Default setter for center attribute changes. Sets up the appropriate value, and passes 
             * it through the to the align attribute.
             *
             * @method _setAlignCenter
             * @protected
             * @param {boolean | node} The attribute value being set. 
             * @return {Number} The attribute value being set.
             */
            _setAlignCenter : function(val) {
                if (val) {
                    this.set(ALIGN, {
                        node: val === true ? null : val,
                        points: [PositionExt.CC, PositionExt.CC]
                    });
                }
                return val;
            },

            /**
             * Default attribute change listener for the align attribute, responsible
             * for updating the UI, in response to attribute changes.
             * 
             * @method _afterAlignChange
             * @protected
             * @param {EventFacade} e The event facade for the attribute change
             */
            _afterAlignChange : function(e) {
                if (e.newVal) {
                    this._uiSetAlign(e.newVal.node, e.newVal.points);
                }
            },

            /**
             * Updates the UI to reflect the align value passed in (see the align attribute documentation, for the object stucture expected)
             * @method _uiSetAlign
             * @protected
             * @param {Node | null} The node to align to, or null to indicate the viewport
             */
            _uiSetAlign: function (node, points) {

                if (!L.isArray(points) || points.length != 2) {
                    Y.error("align: Invalid Points Arguments");
                    return;
                }

                var nodeRegion, widgetPoint, nodePoint, xy;

                if (!node) {
                    nodeRegion = this._posNode.get(VIEWPORT_REGION);
                } else {
                    node = Y.Node.get(node);
                    if (node) {
                        nodeRegion = node.get(REGION);
                    }
                }

                if (nodeRegion) {

                    // TODO: ViewportRegion doesn't have width/height - Workaround until normalized in Node/Dom
                    nodeRegion.width = nodeRegion.width || nodeRegion.right - nodeRegion.left;
                    nodeRegion.height = nodeRegion.height || nodeRegion.bottom - nodeRegion.top;

                    widgetPoint = points[0];
                    nodePoint = points[1];

                    // TODO: Optimize KWeight - Would lookup table help?
                    switch (nodePoint) {
                        case PositionExt.TL:
                            xy = [nodeRegion.left, nodeRegion.top];
                            break;
                        case PositionExt.TR:
                            xy = [nodeRegion.right, nodeRegion.top];
                            break;
                        case PositionExt.BL:
                            xy = [nodeRegion.left, nodeRegion.bottom];
                            break;
                        case PositionExt.BR:
                            xy = [nodeRegion.right, nodeRegion.bottom];
                            break;
                        case PositionExt.TC:
                            xy = [nodeRegion.left + Math.floor(nodeRegion.width/2), nodeRegion.top];
                            break;
                        case PositionExt.BC:
                            xy = [nodeRegion.left + Math.floor(nodeRegion.width/2), nodeRegion.bottom];
                            break;
                        case PositionExt.LC:
                            xy = [nodeRegion.left, nodeRegion.top + Math.floor(nodeRegion.height/2)];
                            break;
                        case PositionExt.RC:
                            xy = [nodeRegion.right, nodeRegion.top + Math.floor(nodeRegion.height/2), widgetPoint];
                            break;
                        case PositionExt.CC:
                            xy = [nodeRegion.left + Math.floor(nodeRegion.width/2), nodeRegion.top + Math.floor(nodeRegion.height/2), widgetPoint];
                            break;
                        default:
                            Y.log("align: Invalid Points Arguments", "info", "widget-position-extras");
                            break;
                    }

                    if (xy) {
                        this._doAlign(widgetPoint, xy[0], xy[1]);
                    }
                }
            },

            /**
             * Helper method, used to align the given point on the widget, with the XY page co-ordinates provided.
             *
             * @method _doAlign
             * @private
             * @param {String} widgetPoint Supported point constant (e.g. WidgetPositionExt.TL)
             * @param {Number} x X page co-ordinate to align to
             * @param {Number} y Y page co-ordinate to align to
             */
            _doAlign : function(widgetPoint, x, y) {
                var widgetNode = this._posNode,
                    xy;

                switch (widgetPoint) {
                    case PositionExt.TL:
                        xy = [x, y];
                        break;
                    case PositionExt.TR:
                        xy = [x - widgetNode.get(OFFSET_WIDTH), y];
                        break;
                    case PositionExt.BL:
                        xy = [x, y - widgetNode.get(OFFSET_HEIGHT)];
                        break;
                    case PositionExt.BR:
                        xy = [x - widgetNode.get(OFFSET_WIDTH), y - widgetNode.get(OFFSET_HEIGHT)];
                        break;
                    case PositionExt.TC:
                        xy = [x - (widgetNode.get(OFFSET_WIDTH)/2), y];
                        break;
                    case PositionExt.BC:
                        xy = [x - (widgetNode.get(OFFSET_WIDTH)/2), y - widgetNode.get(OFFSET_HEIGHT)];
                        break;
                    case PositionExt.LC:
                        xy = [x, y - (widgetNode.get(OFFSET_HEIGHT)/2)];
                        break;
                    case PositionExt.RC:
                        xy = [(x - widgetNode.get(OFFSET_WIDTH)), y - (widgetNode.get(OFFSET_HEIGHT)/2)];
                        break;
                    case PositionExt.CC:
                        xy = [x - (widgetNode.get(OFFSET_WIDTH)/2), y - (widgetNode.get(OFFSET_HEIGHT)/2)];
                        break;
                    default:
                        Y.log("align: Invalid Points Argument", "info", "widget-position-extras");
                        break;
                }

                if (xy) {
                    this.move(xy);
                }
            },

            /**
             * Aligns the Widget to the provided node (or viewport) using the provided
             * points. The method can be invoked directly, however it will result in 
             * the align attribute being out of sync with current position of the of Widget.
             * 
             * @method align
             * @param {Node | String | null} node A reference (or selector string) for the Node which with the Widget is to be aligned.
             * If null is passed in, the Widget will be aligned with the viewport.
             * @param {Array[2]} points A two element array, specifying the points on the Widget and node/viewport which need to be aligned. 
             * The first entry is the point on the Widget, and the second entry is the point on the node/viewport which need to align.
             * Valid point references are defined as static constants on the WidgetPositionExt class. 
             * 
             * e.g. [WidgetPositionExt.TL, WidgetPositionExt.TR] will align the top-left corner of the Widget with the top-right corner of the node/viewport.
             */
            align: function (node, points) {
                this.set(ALIGN, {node: node, points:points});
            },

            /**
             * Centers the container in the viewport, or if a node is passed in,
             * the node.
             *
             * @method centered
             * @param {Node | String} node Optional. A node reference or selector string defining the node 
             * inside which the Widget is to be centered. If not passed in, the Widget will be centered in the 
             * viewport.
             */
            centered: function (node) {
                this.align(node, [PositionExt.CC, PositionExt.CC]);
            }
        };

        Y.WidgetPositionExt = PositionExt;


}, '@VERSION@' ,{requires:['widget', 'widget-position']});
