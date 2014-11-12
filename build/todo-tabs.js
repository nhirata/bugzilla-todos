/** @jsx React.DOM */
var TodoTabs = (function() {
  var baseURL = "https://bugzilla.mozilla.org";
  var bugURL = baseURL + "/show_bug.cgi?id=";
  var attachURL = baseURL + "/attachment.cgi?id=";
  var reviewURL = baseURL + "/page.cgi?id=splinter.html&bug=" // +"&attachment=" + attachId;

  var TodoTabs = React.createClass({displayName: 'TodoTabs',
    render: function() {
      return (
        React.createElement("div", {id: "todo-lists", className: "tabs"}, 
          React.createElement(TabsNav, {tabs: this.props.tabs, 
              selectedTab: this.props.selectedTab, 
              data: this.props.data, 
              onTabClick: this.handleTabClick}), 
          React.createElement(TabsContent, {tabs: this.props.tabs, 
              selectedTab: this.props.selectedTab, 
              data: this.props.data, 
              includeBlockedBugs: this.props.includeBlockedBugs})
        )
      );
    },
    handleTabClick: function(tabId) {
      this.props.onTabSelect(tabId);
    }
  });

  var TabsNav = React.createClass({displayName: 'TabsNav',
    render: function() {
      var selectedTab = this.props.selectedTab;

      var tabNodes = this.props.tabs.map(function(item, index) {
        var list = this.props.data[item.id];

        // display a count of the items and unseen items in this list
        var count = list.items ? list.items.length : "";
        var newCount = "";
        if (list.newCount) {
          newCount = (
            React.createElement("span", {className: "new-count"}, 
              " +", list.newCount
            )
          );
        }

        var className = "tab" + (selectedTab == item.id ? " tab-selected" : "");

        return (
          React.createElement("li", null, 
            React.createElement("a", {className: className, title: item.alt, 
               onClick: this.onClick.bind(this, item.id)}, 
              item.name, 
              React.createElement("span", {className: "count"}, 
                count
              ), 
              newCount
            )
          )
        );
      }.bind(this));

      return (
        React.createElement("nav", {className: "tab-head"}, 
          React.createElement("ul", null, 
            tabNodes
          )
        )
      );
    },
    onClick: function(index) {
      this.props.onTabClick(index);
    }
  });

  var TabsContent = React.createClass({displayName: 'TabsContent',
    render: function() {
      var panelNodes = this.props.tabs.map(function(tab, index) {
        var data = this.props.data[tab.id];

        var list;
        switch(tab.type) {
          case "patches":
            list = React.createElement(PatchList, {data: data});
            break;
          case "flags":
            list = React.createElement(RespondList, {data: data});
            break;
          case "flags+reviews":
            list = React.createElement(NagList, {data: data});
            break;
          case "bugs":
          default:
            list = React.createElement(BugList, {data: data, 
                      includeBlockedBugs: this.props.includeBlockedBugs});
            break;
        }

        return (
          React.createElement("div", {className: 'tab-content ' + (this.props.selectedTab == tab.id ?
                          'tab-content-selected' : '')}, 
            list
          )
        );
      }.bind(this));

      return (
        React.createElement("div", {className: "tab-body"}, 
          panelNodes
        )
      );
    }
  });

  var BugList = React.createClass({displayName: 'BugList',
    render: function() {
      var items = this.props.data.items;
      if (items) {
        // filter out the blocked bugs, if pref is set
        if (!this.props.includeBlockedBugs) {
          items = items.filter(function(item) {
            return !item.bug.depends_on || !item.bug.depends_on.length;
          });
        }
        var listItems = items.map(function(item) {
          return (
            React.createElement(ListItem, {isNew: item.new}, 
              React.createElement(BugItem, {bug: item.bug})
            )
          );
        });
      }
      return (
        React.createElement(List, {items: items}, 
          listItems
        )
      );
    }
  });

  var NagList = React.createClass({displayName: 'NagList',
    render: function() {
      var items = this.props.data.items;
      if (items) {
        var listItems = items.map(function(item) {
          var flags = item.flags.map(function(flag) {
            return React.createElement(FlagItem, {flag: flag});
          });
          var patches = item.attachments.map(function(patch) {
            var patchFlags = patch.flags.map(function(flag) {
              return React.createElement(FlagItem, {flag: flag});
            });
            return (
              React.createElement("div", null, 
                React.createElement(PatchItem, {patch: patch}), 
                patchFlags
              )
            );
          });
          var requests = patches.concat(flags);

          return (
            React.createElement(ListItem, {isNew: item.new}, 
              React.createElement(BugItem, {bug: item.bug}), 
              React.createElement("div", null, 
                requests
              )
            )
          );
        });
      }
      return (
        React.createElement(List, {items: items}, 
          listItems
        )
      );
    }
  });

  var RespondList = React.createClass({displayName: 'RespondList',
    render: function() {
      var items = this.props.data.items;
      if (items) {
        var listItems = items.map(function(item) {
          var flags = item.bug.flags.map(function(flag) {
            return React.createElement(FlagItem, {flag: flag});
          });
          return (
            React.createElement(ListItem, {isNew: item.new}, 
              React.createElement(BugItem, {bug: item.bug}), 
              React.createElement("div", null, 
                flags
              )
            )
          );
        });
      }
      return (
        React.createElement(List, {items: items}, 
          listItems
        )
      );
    }
  });

  var PatchList = React.createClass({displayName: 'PatchList',
    render: function() {
      var items = this.props.data.items;
      if (items) {
        var listItems = items.map(function(item) {
          var patches = item.attachments.map(function(patch) {
             return React.createElement(PatchItem, {patch: patch});
          });
          return (
            React.createElement(ListItem, {isNew: item.new}, 
              React.createElement(BugItem, {bug: item.bug}), 
              React.createElement("div", null, 
                patches
              )
            )
          );
        });
      }
      return (
        React.createElement(List, {items: items}, 
          listItems
        )
      );
    }
  });

  var List = React.createClass({displayName: 'List',
    render: function() {
      if (!this.props.items) {
        return React.createElement(WaitingList, null);
      }
      if (this.props.items.length == 0) {
        return React.createElement(EmptyList, null);
      }
      return (
        React.createElement("div", null, 
          this.props.children
        )
      );
    }
  })

  var WaitingList = React.createClass({displayName: 'WaitingList',
    render: function() {
      return (
        React.createElement("div", {className: "list-item"}, 
          React.createElement("img", {src: "lib/indicator.gif", className: "spinner"})
        )
      );
    }
  })

  var EmptyList = React.createClass({displayName: 'EmptyList',
    render: function() {
      return (
        React.createElement("div", {className: "list-item empty-message"}, 
          "No items to display"
        )
      );
    }
  })

  var PatchItem = React.createClass({displayName: 'PatchItem',
    render: function() {
      var patch = this.props.patch;
      var size = Math.round(patch.size / 1000) + "KB";
      return (
        React.createElement("div", null, 
          React.createElement("a", {className: "att-link", href: attachURL + patch.id, target: "_blank", 
             title: patch.description + " - " + size}, 
             "patch by ", patch.attacher.name
          ), 
          React.createElement("span", {className: "att-suffix"}, 
            React.createElement("span", {className: "att-date timeago", title: patch.last_change_time}, 
              patch.last_change_time
            )
          )
        )
      );
    }
  });

  var FlagItem = React.createClass({displayName: 'FlagItem',
    render: function() {
      var flag = this.props.flag;
      return (
        React.createElement("div", {className: "flag"}, 
          React.createElement("span", {className: "flag-name"}, 
            flag.name
          ), 
          React.createElement("span", {className: "flag-status"}, 
            flag.status, "  "
          ), 
          React.createElement("span", {className: "flag-requestee"}, 
            flag.requestee
          )
        )
      );
    }
  });

  var BugItem = React.createClass({displayName: 'BugItem',
    render: function() {
      var bug = this.props.bug;
      return (
        React.createElement("div", {className: "bug"}, 
          React.createElement("a", {className: "bug-link", href: bugURL + bug.id, 
             target: "_blank", title: bug.status + " - " + bug.summary}, 
            React.createElement("span", {className: "bug-id"}, 
              bug.id
            ), 
            "- ", 
            React.createElement("span", {className: "full-bug bug-summary"}, 
              bug.summary
            )
          ), 
          React.createElement("span", {className: "item-date timeago", 
                title: bug.last_change_time}, 
            bug.last_change_time
          )
        )
      );
    }
  });

  var ListItem = React.createClass({displayName: 'ListItem',
    render: function() {
      return (
        React.createElement("div", {className: "list-item " + (this.props.isNew ? "new-item" : "")}, 
          this.props.children
        )
      );
    }
  });

  return TodoTabs;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtZWQuanMiLCJzb3VyY2VzIjpbbnVsbF0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFCQUFxQjtBQUNyQixJQUFJLFFBQVEsR0FBRyxDQUFDLFdBQVc7RUFDekIsSUFBSSxPQUFPLEdBQUcsOEJBQThCLENBQUM7RUFDN0MsSUFBSSxNQUFNLEdBQUcsT0FBTyxHQUFHLG1CQUFtQixDQUFDO0VBQzNDLElBQUksU0FBUyxHQUFHLE9BQU8sR0FBRyxxQkFBcUIsQ0FBQztBQUNsRCxFQUFFLElBQUksU0FBUyxHQUFHLE9BQU8sR0FBRyxpQ0FBaUM7O0VBRTNELElBQUksOEJBQThCLHdCQUFBO0lBQ2hDLE1BQU0sRUFBRSxXQUFXO01BQ2pCO1FBQ0Usb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxFQUFBLEVBQUUsQ0FBQyxZQUFBLEVBQVksQ0FBQyxTQUFBLEVBQVMsQ0FBQyxNQUFPLENBQUEsRUFBQTtVQUNwQyxvQkFBQyxPQUFPLEVBQUEsQ0FBQSxDQUFDLElBQUEsRUFBSSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFDO2NBQzNCLFdBQUEsRUFBVyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFDO2NBQ3BDLElBQUEsRUFBSSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFDO2NBQ3RCLFVBQUEsRUFBVSxDQUFFLElBQUksQ0FBQyxjQUFlLENBQUUsQ0FBQSxFQUFBO1VBQ3RDLG9CQUFDLFdBQVcsRUFBQSxDQUFBLENBQUMsSUFBQSxFQUFJLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUM7Y0FDL0IsV0FBQSxFQUFXLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUM7Y0FDcEMsSUFBQSxFQUFJLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUM7Y0FDdEIsa0JBQUEsRUFBa0IsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFtQixDQUFFLENBQUE7UUFDcEQs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UyxDQUFBLEVBQUE7WUFDMUQsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxRQUFTLENBQUEsRUFBQTtjQUN0QixHQUFHLENBQUMsRUFBRztZQUNILENBQUEsRUFBQTtBQUFBLFlBQUEsSUFBQSxFQUFBO0FBQUEsWUFFUCxvQkFBQSxNQUFLLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLHNCQUF1QixDQUFBLEVBQUE7Y0FDcEMsR0FBRyxDQUFDLE9BQVE7WUFDUixDQUFBO1VBQ0wsQ0FBQSxFQUFBO1VBQ0osb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxtQkFBQSxFQUFtQjtnQkFDN0IsS0FBQSxFQUFLLENBQUUsR0FBRyxDQUFDLGdCQUFrQixDQUFBLEVBQUE7WUFDaEMsR0FBRyxDQUFDLGdCQUFpQjtVQUNqQixDQUFBO1FBQ0gsQ0FBQTtRQUNOO0tBQ0g7QUFDTCxHQUFHLENBQUMsQ0FBQzs7RUFFSCxJQUFJLDhCQUE4Qix3QkFBQTtJQUNoQyxNQUFNLEVBQUUsV0FBVztNQUNqQjtRQUNFLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUUsWUFBWSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLFVBQVUsR0FBRyxFQUFFLENBQUcsQ0FBQSxFQUFBO1VBQ2xFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUztRQUNqQixDQUFBO1FBQ047S0FDSDtBQUNMLEdBQUcsQ0FBQyxDQUFDOztFQUVILE9BQU8sUUFBUSxDQUFDO0NBQ2pCLEdBQUciLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBUb2RvVGFicyA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGJhc2VVUkwgPSBcImh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmdcIjtcbiAgdmFyIGJ1Z1VSTCA9IGJhc2VVUkwgKyBcIi9zaG93X2J1Zy5jZ2k/aWQ9XCI7XG4gIHZhciBhdHRhY2hVUkwgPSBiYXNlVVJMICsgXCIvYXR0YWNobWVudC5jZ2k/aWQ9XCI7XG4gIHZhciByZXZpZXdVUkwgPSBiYXNlVVJMICsgXCIvcGFnZS5jZ2k/aWQ9c3BsaW50ZXIuaHRtbCZidWc9XCIgLy8gK1wiJmF0dGFjaG1lbnQ9XCIgKyBhdHRhY2hJZDtcblxuICB2YXIgVG9kb1RhYnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgaWQ9XCJ0b2RvLWxpc3RzXCIgY2xhc3NOYW1lPVwidGFic1wiPlxuICAgICAgICAgIDxUYWJzTmF2IHRhYnM9e3RoaXMucHJvcHMudGFic31cbiAgICAgICAgICAgICAgc2VsZWN0ZWRUYWI9e3RoaXMucHJvcHMuc2VsZWN0ZWRUYWJ9XG4gICAgICAgICAgICAgIGRhdGE9e3RoaXMucHJvcHMuZGF0YX1cbiAgICAgICAgICAgICAgb25UYWJDbGljaz17dGhpcy5oYW5kbGVUYWJDbGlja30vPlxuICAgICAgICAgIDxUYWJzQ29udGVudCB0YWJzPXt0aGlzLnByb3BzLnRhYnN9XG4gICAgICAgICAgICAgIHNlbGVjdGVkVGFiPXt0aGlzLnByb3BzLnNlbGVjdGVkVGFifVxuICAgICAgICAgICAgICBkYXRhPXt0aGlzLnByb3BzLmRhdGF9XG4gICAgICAgICAgICAgIGluY2x1ZGVCbG9ja2VkQnVncz17dGhpcy5wcm9wcy5pbmNsdWRlQmxvY2tlZEJ1Z3N9Lz5cbiAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICAgIH0sXG4gICAgaGFuZGxlVGFiQ2xpY2s6IGZ1bmN0aW9uKHRhYklkKSB7XG4gICAgICB0aGlzLnByb3BzLm9uVGFiU2VsZWN0KHRhYklkKTtcbiAgICB9XG4gIH0pO1xuXG4gIHZhciBUYWJzTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZWN0ZWRUYWIgPSB0aGlzLnByb3BzLnNlbGVjdGVkVGFiO1xuXG4gICAgICB2YXIgdGFiTm9kZXMgPSB0aGlzLnByb3BzLnRhYnMubWFwKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5wcm9wcy5kYXRhW2l0ZW0uaWRdO1xuXG4gICAgICAgIC8vIGRpc3BsYXkgYSBjb3VudCBvZiB0aGUgaXRlbXMgYW5kIHVuc2VlbiBpdGVtcyBpbiB0aGlzIGxpc3RcbiAgICAgICAgdmFyIGNvdW50ID0gbGlzdC5pdGVtcyA/IGxpc3QuaXRlbXMubGVuZ3RoIDogXCJcIjtcbiAgICAgICAgdmFyIG5ld0NvdW50ID0gXCJcIjtcbiAgICAgICAgaWYgKGxpc3QubmV3Q291bnQpIHtcbiAgICAgICAgICBuZXdDb3VudCA9IChcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm5ldy1jb3VudFwiPlxuICAgICAgICAgICAgICAmbmJzcDsre2xpc3QubmV3Q291bnR9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjbGFzc05hbWUgPSBcInRhYlwiICsgKHNlbGVjdGVkVGFiID09IGl0ZW0uaWQgPyBcIiB0YWItc2VsZWN0ZWRcIiA6IFwiXCIpO1xuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPGxpPlxuICAgICAgICAgICAgPGEgY2xhc3NOYW1lPXtjbGFzc05hbWV9IHRpdGxlPXtpdGVtLmFsdH1cbiAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGljay5iaW5kKHRoaXMsIGl0ZW0uaWQpfT5cbiAgICAgICAgICAgICAge2l0ZW0ubmFtZX1cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiY291bnRcIj5cbiAgICAgICAgICAgICAgICB7Y291bnR9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAge25ld0NvdW50fVxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvbGk+XG4gICAgICAgICk7XG4gICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8bmF2IGNsYXNzTmFtZT1cInRhYi1oZWFkXCI+XG4gICAgICAgICAgPHVsPlxuICAgICAgICAgICAge3RhYk5vZGVzfVxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvbmF2PlxuICAgICAgKTtcbiAgICB9LFxuICAgIG9uQ2xpY2s6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICB0aGlzLnByb3BzLm9uVGFiQ2xpY2soaW5kZXgpO1xuICAgIH1cbiAgfSk7XG5cbiAgdmFyIFRhYnNDb250ZW50ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcGFuZWxOb2RlcyA9IHRoaXMucHJvcHMudGFicy5tYXAoZnVuY3Rpb24odGFiLCBpbmRleCkge1xuICAgICAgICB2YXIgZGF0YSA9IHRoaXMucHJvcHMuZGF0YVt0YWIuaWRdO1xuXG4gICAgICAgIHZhciBsaXN0O1xuICAgICAgICBzd2l0Y2godGFiLnR5cGUpIHtcbiAgICAgICAgICBjYXNlIFwicGF0Y2hlc1wiOlxuICAgICAgICAgICAgbGlzdCA9IDxQYXRjaExpc3QgZGF0YT17ZGF0YX0vPjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJmbGFnc1wiOlxuICAgICAgICAgICAgbGlzdCA9IDxSZXNwb25kTGlzdCBkYXRhPXtkYXRhfS8+O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImZsYWdzK3Jldmlld3NcIjpcbiAgICAgICAgICAgIGxpc3QgPSA8TmFnTGlzdCBkYXRhPXtkYXRhfS8+O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImJ1Z3NcIjpcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgbGlzdCA9IDxCdWdMaXN0IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUJsb2NrZWRCdWdzPXt0aGlzLnByb3BzLmluY2x1ZGVCbG9ja2VkQnVnc30vPjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17J3RhYi1jb250ZW50ICcgKyAodGhpcy5wcm9wcy5zZWxlY3RlZFRhYiA9PSB0YWIuaWQgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAndGFiLWNvbnRlbnQtc2VsZWN0ZWQnIDogJycpfT5cbiAgICAgICAgICAgIHtsaXN0fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0YWItYm9keVwiPlxuICAgICAgICAgIHtwYW5lbE5vZGVzfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICB2YXIgQnVnTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGl0ZW1zID0gdGhpcy5wcm9wcy5kYXRhLml0ZW1zO1xuICAgICAgaWYgKGl0ZW1zKSB7XG4gICAgICAgIC8vIGZpbHRlciBvdXQgdGhlIGJsb2NrZWQgYnVncywgaWYgcHJlZiBpcyBzZXRcbiAgICAgICAgaWYgKCF0aGlzLnByb3BzLmluY2x1ZGVCbG9ja2VkQnVncykge1xuICAgICAgICAgIGl0ZW1zID0gaXRlbXMuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiAhaXRlbS5idWcuZGVwZW5kc19vbiB8fCAhaXRlbS5idWcuZGVwZW5kc19vbi5sZW5ndGg7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxpc3RJdGVtcyA9IGl0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxMaXN0SXRlbSBpc05ldz17aXRlbS5uZXd9PlxuICAgICAgICAgICAgICA8QnVnSXRlbSBidWc9e2l0ZW0uYnVnfS8+XG4gICAgICAgICAgICA8L0xpc3RJdGVtPlxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPExpc3QgaXRlbXM9e2l0ZW1zfT5cbiAgICAgICAgICB7bGlzdEl0ZW1zfVxuICAgICAgICA8L0xpc3Q+XG4gICAgICApO1xuICAgIH1cbiAgfSk7XG5cbiAgdmFyIE5hZ0xpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpdGVtcyA9IHRoaXMucHJvcHMuZGF0YS5pdGVtcztcbiAgICAgIGlmIChpdGVtcykge1xuICAgICAgICB2YXIgbGlzdEl0ZW1zID0gaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICB2YXIgZmxhZ3MgPSBpdGVtLmZsYWdzLm1hcChmdW5jdGlvbihmbGFnKSB7XG4gICAgICAgICAgICByZXR1cm4gPEZsYWdJdGVtIGZsYWc9e2ZsYWd9Lz47XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdmFyIHBhdGNoZXMgPSBpdGVtLmF0dGFjaG1lbnRzLm1hcChmdW5jdGlvbihwYXRjaCkge1xuICAgICAgICAgICAgdmFyIHBhdGNoRmxhZ3MgPSBwYXRjaC5mbGFncy5tYXAoZnVuY3Rpb24oZmxhZykge1xuICAgICAgICAgICAgICByZXR1cm4gPEZsYWdJdGVtIGZsYWc9e2ZsYWd9Lz47XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPFBhdGNoSXRlbSBwYXRjaD17cGF0Y2h9Lz5cbiAgICAgICAgICAgICAgICB7cGF0Y2hGbGFnc31cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHZhciByZXF1ZXN0cyA9IHBhdGNoZXMuY29uY2F0KGZsYWdzKTtcblxuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8TGlzdEl0ZW0gaXNOZXc9e2l0ZW0ubmV3fT5cbiAgICAgICAgICAgICAgPEJ1Z0l0ZW0gYnVnPXtpdGVtLmJ1Z30vPlxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIHtyZXF1ZXN0c31cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L0xpc3RJdGVtPlxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPExpc3QgaXRlbXM9e2l0ZW1zfT5cbiAgICAgICAgICB7bGlzdEl0ZW1zfVxuICAgICAgICA8L0xpc3Q+XG4gICAgICApO1xuICAgIH1cbiAgfSk7XG5cbiAgdmFyIFJlc3BvbmRMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaXRlbXMgPSB0aGlzLnByb3BzLmRhdGEuaXRlbXM7XG4gICAgICBpZiAoaXRlbXMpIHtcbiAgICAgICAgdmFyIGxpc3RJdGVtcyA9IGl0ZW1zLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgdmFyIGZsYWdzID0gaXRlbS5idWcuZmxhZ3MubWFwKGZ1bmN0aW9uKGZsYWcpIHtcbiAgICAgICAgICAgIHJldHVybiA8RmxhZ0l0ZW0gZmxhZz17ZmxhZ30vPjtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPExpc3RJdGVtIGlzTmV3PXtpdGVtLm5ld30+XG4gICAgICAgICAgICAgIDxCdWdJdGVtIGJ1Zz17aXRlbS5idWd9Lz5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICB7ZmxhZ3N9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9MaXN0SXRlbT5cbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxMaXN0IGl0ZW1zPXtpdGVtc30+XG4gICAgICAgICAge2xpc3RJdGVtc31cbiAgICAgICAgPC9MaXN0PlxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xuXG4gIHZhciBQYXRjaExpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpdGVtcyA9IHRoaXMucHJvcHMuZGF0YS5pdGVtcztcbiAgICAgIGlmIChpdGVtcykge1xuICAgICAgICB2YXIgbGlzdEl0ZW1zID0gaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICB2YXIgcGF0Y2hlcyA9IGl0ZW0uYXR0YWNobWVudHMubWFwKGZ1bmN0aW9uKHBhdGNoKSB7XG4gICAgICAgICAgICAgcmV0dXJuIDxQYXRjaEl0ZW0gcGF0Y2g9e3BhdGNofS8+O1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8TGlzdEl0ZW0gaXNOZXc9e2l0ZW0ubmV3fT5cbiAgICAgICAgICAgICAgPEJ1Z0l0ZW0gYnVnPXtpdGVtLmJ1Z30vPlxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIHtwYXRjaGVzfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvTGlzdEl0ZW0+XG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8TGlzdCBpdGVtcz17aXRlbXN9PlxuICAgICAgICAgIHtsaXN0SXRlbXN9XG4gICAgICAgIDwvTGlzdD5cbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICB2YXIgTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLnByb3BzLml0ZW1zKSB7XG4gICAgICAgIHJldHVybiA8V2FpdGluZ0xpc3QvPjtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnByb3BzLml0ZW1zLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIHJldHVybiA8RW1wdHlMaXN0Lz47XG4gICAgICB9XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIHt0aGlzLnByb3BzLmNoaWxkcmVufVxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gICAgfVxuICB9KVxuXG4gIHZhciBXYWl0aW5nTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsaXN0LWl0ZW1cIj5cbiAgICAgICAgICA8aW1nIHNyYz0nbGliL2luZGljYXRvci5naWYnIGNsYXNzTmFtZT0nc3Bpbm5lcic+PC9pbWc+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKTtcbiAgICB9XG4gIH0pXG5cbiAgdmFyIEVtcHR5TGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsaXN0LWl0ZW0gZW1wdHktbWVzc2FnZVwiPlxuICAgICAgICAgIE5vIGl0ZW1zIHRvIGRpc3BsYXlcbiAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICAgIH1cbiAgfSlcblxuICB2YXIgUGF0Y2hJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcGF0Y2ggPSB0aGlzLnByb3BzLnBhdGNoO1xuICAgICAgdmFyIHNpemUgPSBNYXRoLnJvdW5kKHBhdGNoLnNpemUgLyAxMDAwKSArIFwiS0JcIjtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGEgY2xhc3NOYW1lPVwiYXR0LWxpbmtcIiBocmVmPXthdHRhY2hVUkwgKyBwYXRjaC5pZH0gdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgICAgICB0aXRsZT17cGF0Y2guZGVzY3JpcHRpb24gKyBcIiAtIFwiICsgc2l6ZX0+XG4gICAgICAgICAgICAgcGF0Y2ggYnkge3BhdGNoLmF0dGFjaGVyLm5hbWV9XG4gICAgICAgICAgPC9hPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImF0dC1zdWZmaXhcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImF0dC1kYXRlIHRpbWVhZ29cIiB0aXRsZT17cGF0Y2gubGFzdF9jaGFuZ2VfdGltZX0+XG4gICAgICAgICAgICAgIHtwYXRjaC5sYXN0X2NoYW5nZV90aW1lfVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICAgIH1cbiAgfSk7XG5cbiAgdmFyIEZsYWdJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZmxhZyA9IHRoaXMucHJvcHMuZmxhZztcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxhZ1wiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZsYWctbmFtZVwiPlxuICAgICAgICAgICAge2ZsYWcubmFtZX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmxhZy1zdGF0dXNcIj5cbiAgICAgICAgICAgIHtmbGFnLnN0YXR1c30gJm5ic3A7XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZsYWctcmVxdWVzdGVlXCI+XG4gICAgICAgICAgICB7ZmxhZy5yZXF1ZXN0ZWV9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICB2YXIgQnVnSXRlbSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGJ1ZyA9IHRoaXMucHJvcHMuYnVnO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJidWdcIj5cbiAgICAgICAgICA8YSBjbGFzc05hbWU9XCJidWctbGlua1wiIGhyZWY9e2J1Z1VSTCArIGJ1Zy5pZH1cbiAgICAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIiB0aXRsZT17YnVnLnN0YXR1cyArIFwiIC0gXCIgKyBidWcuc3VtbWFyeX0+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJidWctaWRcIj5cbiAgICAgICAgICAgICAge2J1Zy5pZH1cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIC0mbmJzcDtcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZ1bGwtYnVnIGJ1Zy1zdW1tYXJ5XCI+XG4gICAgICAgICAgICAgIHtidWcuc3VtbWFyeX1cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8L2E+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaXRlbS1kYXRlIHRpbWVhZ29cIlxuICAgICAgICAgICAgICAgIHRpdGxlPXtidWcubGFzdF9jaGFuZ2VfdGltZX0+XG4gICAgICAgICAgICB7YnVnLmxhc3RfY2hhbmdlX3RpbWV9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICB2YXIgTGlzdEl0ZW0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtcImxpc3QtaXRlbSBcIiArICh0aGlzLnByb3BzLmlzTmV3ID8gXCJuZXctaXRlbVwiIDogXCJcIil9PlxuICAgICAgICAgIHt0aGlzLnByb3BzLmNoaWxkcmVufVxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gVG9kb1RhYnM7XG59KSgpOyJdfQ==