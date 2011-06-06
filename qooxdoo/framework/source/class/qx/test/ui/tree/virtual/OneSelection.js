/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

qx.Class.define("qx.test.ui.tree.virtual.OneSelection",
{
  extend : qx.test.ui.tree.virtual.SingleSelection,

  members :
  {
    setUp : function()
    {
      this.base(arguments);

      this.tree.setSelectionMode("one");
    },
    
    
    testSelectionWithClosedNode : function()
    {
      var root = this.createModelAndSetModel(2);
      var selection = this.tree.getSelection();

      var parent = root.getChildren().getItem(0);
      var itemToSelect = parent.getChildren().getItem(2);
      this.tree.openNode(parent);
      selection.push(itemToSelect);

      // check selection from tree
      this.assertEquals(1, selection.getLength(), "On Tree");
      this.assertEquals(itemToSelect, selection.getItem(0), "On Tree");

      // check selection from manager
      var selectionOnManager = this.tree._manager.getSelection();
      this.assertEquals(1, selectionOnManager.length);
      this.assertEquals(this.tree.getLookupTable().indexOf(itemToSelect), selectionOnManager[0]);

      this.tree.closeNode(parent);
      
      var selectionOnManager = this.tree._manager.getSelection();
      this.assertEquals(1, selection.getLength(), "Selection not reset on Tree");
      this.assertEquals(parent, selection.getItem(0), "Selection not reset on Tree");
      this.assertEquals(1, selectionOnManager.length, "Selection not reset on manager");
      this.assertEquals(this.tree.getLookupTable().indexOf(parent), selectionOnManager[0], "Selection not reset on manager");
    },

    
    testSelectionWithClosedParentNode : function()
    {
      var root = this.createModelAndSetModel(3);
      var selection = this.tree.getSelection();

      var nodeToClose = root.getChildren().getItem(0);
      var parent = nodeToClose.getChildren().getItem(1);
      var itemToSelect = parent.getChildren().getItem(2);
      this.tree.openNodeAndParents(parent);
      selection.push(itemToSelect);

      // check selection from tree
      this.assertEquals(1, selection.getLength(), "On Tree");
      this.assertEquals(itemToSelect, selection.getItem(0), "On Tree");

      // check selection from manager
      var selectionOnManager = this.tree._manager.getSelection();
      this.assertEquals(1, selectionOnManager.length);
      this.assertEquals(this.tree.getLookupTable().indexOf(itemToSelect), selectionOnManager[0]);

      this.tree.closeNode(nodeToClose);
      
      var selectionOnManager = this.tree._manager.getSelection();
      this.assertEquals(1, selection.getLength(), "Selection not reset on Tree");
      this.assertEquals(nodeToClose, selection.getItem(0), "Selection not reset on Tree");
      this.assertEquals(1, selectionOnManager.length, "Selection not reset on manager");
      this.assertEquals(this.tree.getLookupTable().indexOf(nodeToClose), selectionOnManager[0], "Selection not reset on manager");
    },

    testRemoveItem : function()
    {
      var root = this.createModelAndSetModel(2);
      var selection = this.tree.getSelection();

      var parent = root.getChildren().getItem(0);
      var itemToSelect = parent.getChildren().getItem(2);
      this.tree.openNode(parent);
      selection.push(itemToSelect);

      // check selection from tree before remove item
      this.assertEquals(1, selection.getLength(), "On Tree (setup)");
      this.assertEquals(itemToSelect, selection.getItem(0), "On Tree (setup)");

      // remove selected item
      parent.getChildren().removeAt(2);

      // check selection from list
      this.assertEquals(1, selection.getLength(), "On Tree");
      this.assertEquals(parent, selection.getItem(0), "On Tree");

      // check selection from manager
      var selectionOnManager = this.tree._manager.getSelection();
      this.assertEquals(1, selectionOnManager.length, "On Manager");
      this.assertEquals(this.tree.getLookupTable().indexOf(parent), selectionOnManager[0], "On Manager");
    }
  }
});
