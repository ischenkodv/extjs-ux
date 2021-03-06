/**
 * Ext.ux.container.ButtonSegment Class
 * 
 * @author Harald Hanek (c) 2011
 * 
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

Ext.define('Ext.ux.container.ButtonSegment', {
    extend: 'Ext.container.ButtonGroup',
    alias: 'widget.buttonsegment',

    baseCls: Ext.baseCSSPrefix + 'sbtn',

    buttonCls: Ext.baseCSSPrefix + 'sbtn',
    
    unstyled: true,
    
    frame: false,
    
    onRender: function()
	{
		var me = this;
		me.callParent(arguments);

		me.activeItem = (me.activeItem + 1 > me.items.length) ? 0 : me.activeItem;

		me.items.each(function(el, c)
		{
			if(me.items.length === 1)
				el.cls = ' ' + me.buttonCls +'-single';
			else
				el.cls = c == 0 ? ' ' + me.buttonCls +'-first' : (c == me.items.length - 1 ? ' ' + me.buttonCls +'-last' : ' ' + me.buttonCls +'-item');
		});

	},

    onBeforeAdd: function(component)
    {
    }
});