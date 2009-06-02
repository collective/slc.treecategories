from Products.Archetypes import Widget
from Products.Archetypes.Registry import registerWidget

class TreeWidget(Widget.InAndOutWidget):
    _properties = Widget.InAndOutWidget._properties.copy() #@UndefinedVariable
    _properties.update({
        'macro' : "widgets/tree",
        })
    
registerWidget(TreeWidget,
               title='Tree',
               description=('Renders a widget for moving items '
                            'from one tree to another. Items are '
                            'removed from the first tree.'),
               used_for=('Products.Archetypes.Field.LinesField',)
               )
