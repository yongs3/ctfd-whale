CTFd._internal.challenge.data = undefined

CTFd._internal.challenge.renderer = null;

CTFd._internal.challenge.preRender = function () {
}

CTFd._internal.challenge.render = null;

CTFd._internal.challenge.postRender = function () {
    loadInfo();
}

if (window.$ === undefined) window.$ = CTFd.lib.$;

function loadInfo() {
    var challenge_id = CTFd._internal.challenge.data.id;
    var url = "/api/v1/plugins/ctfd-whale/container?challenge_id=" + challenge_id;

    CTFd.fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(function (response) {
        if (response.status === 429) {
            // User was ratelimited but process response
            return response.json();
        }
        if (response.status === 403) {
            // User is not logged in or CTF is paused.
            return response.json();
        }
        return response.json();
    }).then(function (response) {
        if (window.t !== undefined) {
            clearTimeout(window.t);
            window.t = undefined;
        }
        if (response.success) response = response.data;
        else CTFd._functions.events.eventAlert({
            title: "실패",
            html: response.message,
            button: "확인"
        });
        if (response.remaining_time != undefined) {
            $('#whale-challenge-user-access').html(response.user_access);
            $('#whale-challenge-lan-domain').html(response.lan_domain);

            // 서버가 준 '남은 초'를 절대 종료 시각으로 환산해 한 번만 고정한다.
            // 직전 표시값을 1씩 깎는 대신 실제 시계 기준의 고정 시각을 보여주므로,
            // 브라우저가 백그라운드 탭 타이머를 느리게 돌려도 표시가 어긋나지 않는다.
            // 또한 클라이언트에서 계산하므로 서버 타임존(UTC)과 무관하게 브라우저 로컬(KST)로 표시된다.
            const endTime = Date.now() + response.remaining_time * 1000;
            $('#whale-challenge-end-time').text(new Date(endTime).toLocaleString('ko-KR'));
            $('#whale-panel-stopped').hide();
            $('#whale-panel-started').show();

            // 종료 시각이 지나면 서버에서 상태를 다시 받아와 패널(실행 중/중지됨)을 전환한다.
            window.t = setTimeout(loadInfo, Math.max(0, endTime - Date.now()) + 1000);
        } else {
            $('#whale-panel-started').hide();
            $('#whale-panel-stopped').show();
        }
    });
};

// 탭이 백그라운드에 있는 동안 타이머가 throttle 되어 갱신이 밀릴 수 있으므로,
// 다시 보이게 되면 즉시 서버 상태를 받아와 표시를 맞춘다.
// (whale 인스턴스 패널이 실제로 떠 있을 때만 동작 — 다른 문제/모달엔 영향 없음)
if (!window.whaleVisibilityBound) {
    window.whaleVisibilityBound = true;
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState !== 'visible') return;
        if ($('#whale-challenge-end-time').length && $('#whale-panel-started').is(':visible')) {
            loadInfo();
        }
    });
}

CTFd._internal.challenge.destroy = function () {
    var challenge_id = CTFd._internal.challenge.data.id;
    var url = "/api/v1/plugins/ctfd-whale/container?challenge_id=" + challenge_id;

    $('#whale-button-destroy').text("처리 중...");
    $('#whale-button-destroy').prop('disabled', true);

    var params = {};

    CTFd.fetch(url, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    }).then(function (response) {
        if (response.status === 429) {
            // User was ratelimited but process response
            return response.json();
        }
        if (response.status === 403) {
            // User is not logged in or CTF is paused.
            return response.json();
        }
        return response.json();
    }).then(function (response) {
        if (response.success) {
            loadInfo();
            CTFd._functions.events.eventAlert({
                title: "성공",
                html: "인스턴스가 삭제되었습니다.",
                button: "확인"
            });
        } else {
            CTFd._functions.events.eventAlert({
                title: "실패",
                html: response.message,
                button: "확인"
            });
        }
    }).finally(() => {
        $('#whale-button-destroy').text("인스턴스 삭제");
        $('#whale-button-destroy').prop('disabled', false);
    });
};

CTFd._internal.challenge.renew = function () {
    var challenge_id = CTFd._internal.challenge.data.id;
    var url = "/api/v1/plugins/ctfd-whale/container?challenge_id=" + challenge_id;

    $('#whale-button-renew').text("처리 중...");
    $('#whale-button-renew').prop('disabled', true);

    var params = {};

    CTFd.fetch(url, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    }).then(function (response) {
        if (response.status === 429) {
            // User was ratelimited but process response
            return response.json();
        }
        if (response.status === 403) {
            // User is not logged in or CTF is paused.
            return response.json();
        }
        return response.json();
    }).then(function (response) {
        if (response.success) {
            loadInfo();
            CTFd._functions.events.eventAlert({
                title: "성공",
                html: "인스턴스가 연장되었습니다.",
                button: "확인"
            });
        } else {
            CTFd._functions.events.eventAlert({
                title: "실패",
                html: response.message,
                button: "확인"
            });
        }
    }).finally(() => {
        $('#whale-button-renew').text("인스턴스 연장");
        $('#whale-button-renew').prop('disabled', false);
    });
};

CTFd._internal.challenge.boot = function () {
    var challenge_id = CTFd._internal.challenge.data.id;
    var url = "/api/v1/plugins/ctfd-whale/container?challenge_id=" + challenge_id;

    $('#whale-button-boot').text("처리 중...");
    $('#whale-button-boot').prop('disabled', true);

    var params = {};

    CTFd.fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    }).then(function (response) {
        if (response.status === 429) {
            // User was ratelimited but process response
            return response.json();
        }
        if (response.status === 403) {
            // User is not logged in or CTF is paused.
            return response.json();
        }
        return response.json();
    }).then(function (response) {
        if (response.success) {
            loadInfo();
            CTFd._functions.events.eventAlert({
                title: "성공",
                html: "인스턴스가 생성되었습니다.",
                button: "확인"
            });
        } else {
            CTFd._functions.events.eventAlert({
                title: "실패",
                html: response.message,
                button: "확인"
            });
        }
    }).finally(() => {
        $('#whale-button-boot').text("인스턴스 생성");
        $('#whale-button-boot').prop('disabled', false);
    });
};


CTFd._internal.challenge.submit = function (preview) {
    var challenge_id = CTFd._internal.challenge.data.id;
    var submission = $('#challenge-input').val()

    var body = {
        'challenge_id': challenge_id,
        'submission': submission,
    }
    var params = {}
    if (preview)
        params['preview'] = true

    return CTFd.api.post_challenge_attempt(params, body).then(function (response) {
        if (response.status === 429) {
            // User was ratelimited but process response
            return response
        }
        if (response.status === 403) {
            // User is not logged in or CTF is paused.
            return response
        }
        return response
    })
};
