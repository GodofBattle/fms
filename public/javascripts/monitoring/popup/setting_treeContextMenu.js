const TreeContextMenu = function(_id, _onHideContextMenu) {
    const id = _id;

    let m_parent_id = undefined;
    let m_tree_node_id = undefined;

    function showContextMenu(info) {
        m_parent_id = info.parent_id;
        m_tree_node_id = info.selected_id;

        $(id).css({ top: info.y + 'px', left: info.x + 'px', visibility: 'visible' });
        $(document).bind('mousedown', _onHideContextMenu);
    }

    function hideContextMenu() {
        m_parent_id = undefined;
        m_tree_node_id = undefined;

        $(id).css({ visibility: 'hidden' });
        $(document).unbind('mousedown');
    }

    return {
        ShowContextMenu: function(info) { showContextMenu(info); },
        HideContextMenu: function() { hideContextMenu(); },
        getId: function() { return id; },
        getSelectedId: function() { return m_tree_node_id }
    }
}