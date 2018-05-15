const API_URL = 'https://api.magicthegathering.io/v1/cards'


const mtg_callback = {
    remoteFilter: (() => {
        let oldQuery
        let oldCards
        let promise = null

        return (query, callback) => {
            // 気休めの接続低減
            // 変換開始時の空文字queryを排除している
            if (!query) {
                return
            }
            // 気休めの接続低減
            // カーソル移動でイベントが発生するので同値なら結果を使い回す
            if (query === oldQuery) {
                callback(oldCards)
                return
            }

            if (promise) {
                // 気休めの負荷緩和
                // 英字入力やカーソル移動で通信が多発するので、古いのはabortしてやる
                promise.abort()
                promise = null;
            }

            promise = $.getJSON(
                API_URL,
                {
                    name: query,
                    language: 'Japanese',
                },
                (data) => {
                    let cards = $.map(data.cards, (card) => {
                        const foreignData = $.grep(card.foreignNames, (foreignName) => {
                            return (foreignName.language == 'Japanese')
                        })[0]

                        return {
                            name: card.name,
                            jname: foreignData.name || card.name,
                            jimageUrl: foreignData.imageUrl || card.imageUrl,
                        }
                    })

                    // 外部通信なので、検索中と区別がつくように結果0用のリストを追加する
                    if (cards.length == 0) {
                        cards = [{
                            name: 'Not matched',
                            jname: 'Not matched',
                            jimageUrl: 'Not matched',
                        }];
                        cards[0].atwho_order = 0

                        console.log('cards2', cards)
                    }

                    oldQuery = query
                    oldCards = cards
                    promise = null
                    callback(cards)
                }
            )
        }
    })(),


    sorter: (query, items, searchKey) => {
        var _results, i, item, len;
        if (!query) {
            return items;
        }
        _results = [];
        for (i = 0, len = items.length; i < len; i++) {
            item = items[i];
            // remoteFilterで作ったNot matchedを活かすため、手動でordwerを決めた場合は判定しないようカスタマイズ
            if (typeof item.atwho_order === 'undefined') {
                item.atwho_order = item.atwho_order || new String(item[searchKey]).toLowerCase().indexOf(query.toLowerCase());
            }
            if (item.atwho_order > -1) {
                _results.push(item);
            }
        }
        return _results.sort(function (a, b) {
            return a.atwho_order - b.atwho_order;
        });
    },
}
