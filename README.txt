Introduction
============
This packages adds support for categories with hierarchies.
To accomplish this, it offers a widget for setting the categories
on content, and a custom Indexer that takes care that the hierarchical
nature is working with search too.

How to use it
-------------
1. Create a Vocabulary with a hierarchy in the ATVocabularyManager
2. Create a Content type a Field that uses that vocabulary and the
   InlineTreeWidget.
3. Add an instance of the content type and use it.

Search
------
If somebody wants to search for all nodes, and some object has
a subnode selected, the package assumes that given somebody also wants to
find that object. If you want to see all cars and one item has the
sub category beetle set, this item will be found too. This functionality
is provided by a custom indexer 'tree_categories'.

InlineTreeWidget
----------------
The widget is based on the jquery extension dynatree:
http://wwwendt.de/tech/dynatree/index.html

It generates list of selected options and a button to show a tree of possible
options. You can add Options by clicking on the checkbox, and you can remove
buttons by clicking on the checkbox again. Additionally, the list of selected
options have an x icon per option, that you can use for removing items too.

The changes are applied immediatelly.

Additionally to the possibility of having multiple fields that use the
widget on a single content type, there exists support to use the widget
in customized folder_contents view, for setting options on multiple content
objects at once. That feature is still a bit experimental, so there is no
documentation yet on how to use it. 

Index
-----
Upon installing, a new index is added, tree_categories.
The package also adds an indexer of its own, that tries
to index all vocabulary Fields of all AT Content types.
Be careful, that might slow indexing down!

Todo / Ideas
------------
- It is untested if i18n with vdex categories work together with LinguaPlone
- It would be nice, if we could be independent from ATVocabularyManager.
  That would mean, that this package would contain an utility of its own and
  one or more new views.
- It would also be nice to make this work with dexterity
