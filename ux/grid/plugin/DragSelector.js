/**
 * Ext.ux.grid.plugin DragSelector Class
 * 
 * @author Harald Hanek
 * @copyright 2011, DELACAP, all rights reserved.
 * 
 * The Initial Developer of the Original Code is: Claudio Walser aka Foggy
 * cwa[at]uwd.ch
 * 
 * @copyright 2007-2008, UWD GmbH, all rights reserved.
 * 
 * License details: http://www.gnu.org/licenses/lgpl.html
 * 
 */
Ext.define('Ext.ux.grid.plugin.DragSelector', {
	extend: 'Ext.util.Observable',
	requires: [ 'Ext.dd.DragTracker', 'Ext.util.Region', 'Ext.grid.Scroller' ],
	alias: 'plugin.ux.dragselector',

	isDragging: false,
	scrollTopStart: 0,
	scrollTop: 0,

	init: function(cmp)
	{
		this.grid = cmp;
		this.view = this.grid.getView();
		this.selModel = this.view.getSelectionModel();

		this.mon(this.view, 'render', this.onRender, this);
		this.mon(this.view, 'bodyscroll', this.syncScroll, this);

		if(!this.grid.verticalScroller)
		{
			Ext.apply(this.grid, {
				verticalScroller: {
					xtype: 'gridscroller',
					activePrefetch: false
				}
			});
		}
	},

	onRender: function(view)
	{
		this.tracker = Ext.create('Ext.dd.DragTracker', {
			onBeforeStart: Ext.Function.bind(this.onBeforeStart, this),
			onStart: Ext.Function.bind(this.onStart, this),
			onDrag: Ext.Function.bind(this.onDrag, this),
			onEnd: Ext.Function.bind(this.onEnd, this)
		});

		this.tracker.initEl(view.el);
		this.scroller = view.el;
	},

	syncScroll: function(e)
	{
		// this.syncRegions();
		this.fillRegions();
		var top = this.scroller.getScroll().top;
		this.scrollTop = top - this.scrollTopStart;
		if(this.isDragging)
		{
			this.onDrag(e, true);
		}
	},

	fillAllRegions: function()
	{
		this.mainRegion = this.scroller.getRegion();
		this.bodyRegion = this.scroller.getRegion();

		var objectsSelected = this.objectsSelected = [];

		this.view.all.each(function(el)
		{
			objectsSelected.push(this.selModel.isSelected(objectsSelected.length));

		}, this);

		this.fillRegions();
		this.syncScroll();
	},

	fillRegions: function()
	{
		var rs = this.rs = [];

		this.view.all.each(function(el)
		{
			rs.push(el.getRegion());
		});
	},
	
	/*
	 * syncRegions: function() { this.fillRegions(); },
	 */
	
	cancelClick: function(e)
	{
		this.ctrlState = e.ctrlKey;
		this.shiftState = e.shiftKey;
		// grid.stopEditing();
		var target = e.getTarget();

		if(!this.ctrlState && !this.shiftState && target.className === 'x-grid-body')
		{
			this.selModel.clearSelections();
		}
		return true;
	},

	onBeforeStart: function(e)
	{
		// return false if is a right mouseclick
		if(e.button === 2)
		{
			return false;
		}

		// return false if any grid editor is active
		if(this.grid.activeEditor && this.grid.activeEditor !== null)
		{
			return false;
		}

		// scrollbar fix from digitalbucket.net :)
		if(e.getPageX() > this.view.el.getX() + this.view.el.dom.clientWidth - 20)
		{
			return false;
		}

		// call cancelClick
		this.cancelClick(e);

		return !this.dragSafe || e.target == this.view.el.dom;
	},

	onStart: function(e)
	{
		this.scrollTopStart = this.scroller.getScroll().top;
		this.fillAllRegions();
		if(!this.proxy)
		{
			this.proxy = this.view.el.createChild({
				cls: 'x-view-selector'
			});
		}
		else
		{
			this.proxy.setDisplayed('block');
		}
		this.isDragging = true;
	},

	onDrag: function(e, scaleSelector)
	{
		var startXY = this.tracker.startXY, xy = this.tracker.getXY();

		if(xy[0] < startXY[0] && !scaleSelector)
		{
			xy[0] += 2;
		}

		if(this.scrollTop >= 0)
		{
			if((startXY[1] - this.scrollTop) <= xy[1])
			{
				var y = startXY[1] - this.scrollTop;
				var h = Math.abs(y - xy[1]);
			}
			else
			{
				var y = xy[1];
				var h = Math.abs(startXY[1] - xy[1]) - this.scrollTop;
			}
			var x = Math.min(startXY[0], xy[0]);
			var w = Math.abs(startXY[0] - xy[0]);
			this.bodyRegion.top -= this.scrollTop;
		}
		else
		{
			if((startXY[1] - this.scrollTop) < xy[1])
			{
				var y = startXY[1] - this.scrollTop;
				var h = Math.abs(y - xy[1]);
			}
			else
			{
				var y = xy[1];
				var h = Math.abs((startXY[1] - this.scrollTop) - xy[1]);
			}

			var x = Math.min(startXY[0], xy[0]);
			var w = Math.abs(startXY[0] - xy[0]);

			this.bodyRegion.bottom -= this.scrollTop;
		}

		// ( Number top, Number right, Number bottom, Number left )
		var dragRegion = Ext.create('Ext.util.Region', y, x + w, y + h, x);

		// dragRegion.constrainTo(view.el.getRegion());
		dragRegion.constrainTo(this.bodyRegion);

		this.proxy.setRegion(dragRegion);

		var view = this.view; // neu
		var s = this.scroller; // neu

		for( var i = 0; i < this.rs.length; i++)
		{
			var r = this.rs[i], sel = dragRegion.intersect(r);
			var selected = this.selModel.isSelected(i);
			var selectedBefore = this.objectsSelected[i];

			if(this.ctrlState)
			{
				if(selectedBefore)
				{
					if(sel && selected)
					{
						view.getSelectionModel().deselect(i);
					}
					else if(!sel && !selected)
					{
						view.getSelectionModel().select(i, true);
					}
				}
				else
				{
					if(sel && !selected)
					{
						view.getSelectionModel().select(i, true);
					}
					else if(!sel && selected)
					{
						view.getSelectionModel().deselect(i);
					}
				}
			}
			else
			{
				if(sel && !selected)
				{
					view.getSelectionModel().select(i, true);
				}
				else if(!sel && selected)
				{
					view.getSelectionModel().deselect(i);
				}
			}
		}

		if(xy[1] + 10 >= this.mainRegion.bottom)
		{
			// slow up for ie
			if(Ext.isIE)
			{
				setTimeout(function()
				{
					this.scroller.scrollTo('top', this.scroller.getScroll().top + 40);
				}, 100);
			}
			else
			{
				this.grid.verticalScroller.setScrollTop(s.getScroll().top + 40);
			}
		}

		if(xy[1] - 10 <= this.mainRegion.top)
		{
			// slow up for ie
			if(Ext.isIE)
			{
				setTimeout(function()
				{
					this.scroller.scrollTo('top', this.scroller.getScroll().top - 40);
				}, 100);
			}
			else
			{
				this.grid.verticalScroller.setScrollTop(s.getScroll().top - 40);
			}
		}
	},

	onEnd: function(e)
	{
		var me = this;
		me.isDragging = false;
		if(me.proxy)
		{
			// this.proxy.setDisplayed(false);
			me.proxy.hide(true);
			// this.proxy.remove();
			me.proxy = null;
		}
		e.preventDefault();
	}
});