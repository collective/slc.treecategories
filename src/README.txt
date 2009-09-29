Introduction
============
This packages adds support for categories with hierarchies.
That means, it offers a widget that enables the user to select 
options out of a tree, and an index that does proper indexing.

How to use it
-------------
1. Create a Vocabulary with a hierarchy in the ATVocabularyManager
2. Create a Content type a Field that uses that vocabulary and the 
   TreeWidget. 
3. Add an instance of the content type and play with it!

Assumptions
-----------
If somebody selects a node, and had some of the nodes subnodes selected 
earlier, the package assumes that the user wanted to generalise the 
categorization, and all subnodes get unset. For example: If one selected the 
categories "Porsche 911" and "Beetle", and now selects "car", "Porsche 911" 
and "Beetle" will become unselected, and can not be selected again.

If somebody wants to search for all nodes, and some object has 
a subnode selected, the package assumes that given somebody also wants to
find that object. If you want to see all cars and one item has the
sub category beetle set, this item will be found too. This functionality
is provided by the custom indexer.

TreeWidget
----------
The treeewidget is based on the jquery extension dynatree:
http://wwwendt.de/tech/dynatree/index.html

It generates two trees that are to the left and the right The left tree
contains items that still can be selected, the other one contains items
that are selected. you can add 
categories by clicking on them. There is also a filter box above that
allows for filtering in large trees. The filter is applied to both trees

The tree gets updated immediately, but is not stored yet, one must still
press the save button.

The tree widget supports only LinesFields that have a vocabulary
of type NamedVocabulary from the ATVocabularyManager.

Index
-----
Upon installing, a new index is added, tree_categories.
The package also adds an indexer of its own, that tries
to index all vocabulary Fields of all AT Content types.
Be careful, that might slow indexing down!

Todo / Ideas
------------
- It is untested if i18n with vdex categories work together with LinguaPlone
- Tree building happens in server side, It would be much faster if we would
  always provide the same tree and do the filtering in javascript. 
- If something changes the tree gets rebuild completely. Thats also slow
- It would be nice, if we could be independent from ATVocabularyManager.
  That would mean, that this package would contain an utility of its own and
  one or more new views.
- It would also be nice to make this work with dextery

