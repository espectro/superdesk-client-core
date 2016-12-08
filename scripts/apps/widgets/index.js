var _ = require('lodash');

AnsaSemanticsCtrl.$inject = ['$scope', 'api'];
function AnsaSemanticsCtrl($scope, api) {
    let save = () => {
        $scope.item.semantics = this.data;
        $scope.autosave($scope.item);
    };

    let init = () => {
        if ($scope.item.semantics) {
            this.data = angular.extend({}, $scope.item.semantics);
        } else {
            this.refresh();
        }
    };

    let text = (val) => {
        try {
            return angular.element(val).text();
        } catch (err) {
            return val;
        }
    };

    this.refresh = () => api.save('analysis', {
        lang: 'ITA',
        title: $scope.item.headline,
        text: text($scope.item.abstract) + '\n' + text($scope.item.body_html),
        abstract: ''
    }).then((result) => {
        this.data = result.semantics;
        save();
    });

    this.remove = (term, category) => {
        this.data[category] = _.without(this.data[category], term);
        save();
    };

    init();
}

AnsaRelatedCtrl.$inject = ['$scope', 'api'];
function AnsaRelatedCtrl($scope, api) {
    let init = () => {
        if (!$scope.item.semantics || !$scope.items.semantics.iptcDomains) {
            return;
        }

        let filters = [];
        let semantics = $scope.item.semantics;
        let keys = ['places', 'organizations', 'mainGroups', 'mainLemmas'];

        keys.forEach((key) => {
            if (semantics[key] && semantics[key].length) {
                let f = {};

                f[key] = semantics[key];
                filters.push({terms: f});
            }
        });

        let query = {
            bool: {
                must_not: {term: {guid: $scope.item.guid}},
                must: {terms: {iptcDomains: semantics.iptcDomains}},
                should: filters,
                minimum_should_match: 1
            }
        };

        api.query('archive', {source: {query: query}}).then((response) => {
            this.items = response._items;
        });
    };

    init();
}

angular.module('superdesk.apps.widgets', [])
    .controller('AnsaSemanticsCtrl', AnsaSemanticsCtrl)
    .controller('AnsaRelatedCtrl', AnsaRelatedCtrl)
    .config(['authoringWidgetsProvider', (authoringWidgetsProvider) => {
        authoringWidgetsProvider.widget('ansa-semantics', {
            label: 'Semantics',
            icon: 'related',
            template: 'scripts/apps/widgets/ansa-semantics-widget/ansa-semantics-widget.html',
            order: 7,
            side: 'right',
            display: {authoring: true},
            configurable: false
        });

        authoringWidgetsProvider.widget('ansa-semantics', {
            label: 'Related Items',
            icon: 'related',
            template: 'scripts/apps/widgets/ansa-related-widget/ansa-related-widget.html',
            order: 7,
            side: 'right',
            display: {authoring: true},
            configurable: false
        });
    }]);