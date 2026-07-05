// ==UserScript==
// @name         Stove Reward Event Automator
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  온스토브 리워드 이벤트 페이지 및 새 탭 자동화 스크립트
// @author       You
// @match        https://reward.onstove.com/ko*
// @match        https://*.onstove.com/*
// @icon         https://reward.onstove.com/favicon.ico
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        window.close
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href;
    const decodedUrl = decodeURI(currentUrl);

    // =========================================================================
    // 1. 메인 이벤트 페이지에서의 동작 (https://reward.onstove.com/ko)
    // =========================================================================
    if (currentUrl.includes('https://reward.onstove.com/ko')) {

        function createAutomationButton() {
            if (document.getElementById('stove-auto-btn')) return;

            const btn = document.createElement('button');
            btn.id = 'stove-auto-btn';
            btn.innerText = '자동 미션 시작';

            btn.style.position = 'fixed';
            btn.style.bottom = '30px';
            btn.style.right = '30px';
            btn.style.zIndex = '9999';
            btn.style.padding = '15px 20px';
            btn.style.backgroundColor = '#1e88e5';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '8px';
            btn.style.fontSize = '16px';
            btn.style.fontWeight = 'bold';
            btn.style.cursor = 'pointer';
            btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';

            btn.onclick = async () => {
                if (btn.disabled) return;
                btn.disabled = true;
                btn.innerText = '미션 진행 중...';
                await executeMissionLogic();
                btn.disabled = false;
                btn.innerText = '자동 미션 시작';
            };
            document.body.appendChild(btn);
        }

        function getMissionState(missionName) {
            const allParagraphs = Array.from(document.querySelectorAll('p'));
            const titleElement = allParagraphs.find(el => el.innerText.trim() === missionName);
            if (!titleElement) return null;

            const missionBox = titleElement.closest('.stds-box');
            const button = missionBox ? missionBox.querySelector('button') : null;
            const btnText = button ? button.innerText.trim() : '';

            return {
                button,
                btnText: btnText,
                isRunnable: btnText === '미션하기' && !button.disabled
            };
        }

        async function executeMissionLogic() {
            let clickedCount = 0;

            // [순차 그룹] - 오타 수정: 3초(3000)에서 진짜 0.3초(300)로 변경하여 딜레이 대폭 축소
            for (const name of ["365일 특가 게임 구경하기", "MY홈 방문하기", "스토브 메인 방문하기"]) {
                const state = getMissionState(name);
                if (state && state.isRunnable) {
                    console.log(`[Stove Automator] 🎯 "${name}" 미션 수행 지시`);
                    GM_setValue('autoRunExpire', Date.now() + 15000);
                    state.button.click();
                    clickedCount++;

                    // 3초 대기 버그 수정 -> 0.3초만 대기 후 바로 다음 미션 진행
                    await new Promise(r => setTimeout(r, 300));
                } else {
                    console.log(`[Stove Automator] ⏭️ "${name}" 패스 (상태: ${state ? state.btnText : '없음'})`);
                }
            }

            // 라운지 진입 전 대기 시간도 0.8초에서 0.2초로 단축
            await new Promise(r => setTimeout(r, 200));

            // [라운지 세트 그룹]
            console.log(`[Stove Automator] 라운지 그룹 검사 시작...`);
            for (const name of ["라운지 좋아요 누르기", "라운지 댓글 쓰기", "라운지 글쓰기"]) {
                const state = getMissionState(name);
                if (state && state.isRunnable) {
                    console.log(`[Stove Automator] 🎯 라운지 타겟 포착 ("${name}"). 통합 주소로 강제 이동합니다.`);
                    GM_setValue('autoRunExpire', Date.now() + 15000);

                    GM_openInTab('https://lounge.onstove.com/feed/%ED%94%8C%EB%A0%88%EC%9D%B4%ED%81%AC%EB%AF%B8%EC%85%98', { active: true });

                    clickedCount++;
                    break;
                }
            }

            if (clickedCount === 0) {
                console.log(`[Stove Automator] 새로 할 미션이 없어 보상 일괄 수령을 실행합니다.`);
                await claimAllRewards();
            }
        }

        async function claimAllRewards() {
            console.log(`[Stove Automator] "받기" 버튼 수령 동작 개시`);
            const buttons = document.querySelectorAll('button');
            let claimCount = 0;

            for (const btn of buttons) {
                if (btn.innerText.trim() === '받기' && !btn.disabled) {
                    console.log(`[Stove Automator] 🎁 플레이크 보상 획득!`);
                    btn.click();
                    claimCount++;
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            if (claimCount > 0) {
                console.log(`[Stove Automator] 총 ${claimCount}개의 보상 수령 완료.`);
            } else {
                console.log(`[Stove Automator] 대기 중인 "받기" 버튼이 없습니다.`);
            }
        }

        createAutomationButton();

        if (GM_getValue('triggerReward', false)) {
            GM_setValue('triggerReward', false);
            console.log(`[Stove Automator] 자동 새로고침 완료. 2초 뒤 일괄 수령 단계를 밟습니다.`);

            const mainBtn = document.getElementById('stove-auto-btn');
            if (mainBtn) {
                mainBtn.disabled = true;
                mainBtn.innerText = '보상 수령 중...';
            }

            setTimeout(async () => {
                await claimAllRewards();
                if (mainBtn) {
                    mainBtn.disabled = false;
                    mainBtn.innerText = '자동 미션 시작';
                }
            }, 2000);

        } else {
            const checkTimer = setInterval(() => {
                if (GM_getValue('triggerReward', false)) {
                    clearInterval(checkTimer);
                    console.log(`[Stove Automator] 연동 신호 감지. 메인 탭 새로고침.`);
                    location.reload();
                }
            }, 1000);
        }
    }

    // =========================================================================
    // 2. 새 탭(라운지 페이지)에서의 동작
    // =========================================================================
    else if (decodedUrl.includes('/feed/플레이크미션')) {
        const expireTime = GM_getValue('autoRunExpire', 0);
        if (Date.now() < expireTime) {
            GM_setValue('autoRunExpire', 0);

            setTimeout(async () => {
                const targetTitle = '플레이크 미션 참여';

                // STEP 1: 내 글 작성하기
                const titleInput = document.querySelector('textarea.sc-feed-editor-form-title');
                if (titleInput) {
                    titleInput.click();
                    titleInput.value = targetTitle;
                    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
                }

                await new Promise(r => setTimeout(r, 800));

                const bodyEditor = document.querySelector('div.fr-element.fr-view[contenteditable="true"]');
                if (bodyEditor) {
                    bodyEditor.innerHTML = '<p>플레이크 미션 참여합니다.</p>';
                    bodyEditor.dispatchEvent(new Event('input', { bubbles: true }));
                }

                await new Promise(r => setTimeout(r, 800));

                const submitBtn = document.querySelector('button.sc-feed-editor-submit-button');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }

                await new Promise(r => setTimeout(r, 3000));

                // STEP 2: 작성한 글 탐색
                const feedItems = Array.from(document.querySelectorAll('.sc-feeds-list-item'));
                let myFeedItem = null;

                for (const item of feedItems) {
                    const titleHeader = item.querySelector('.sc-feed-detail-header-title');
                    if (titleHeader && titleHeader.innerText.trim() === targetTitle) {
                        myFeedItem = item;
                        break;
                    }
                }

                if (!myFeedItem) return;

                // STEP 3: 내 글에 [좋아요] 누르기
                const likeBtn = myFeedItem.querySelector('button.sc-feed-detail-like-button');
                if (likeBtn) likeBtn.click();

                await new Promise(r => setTimeout(r, 1000));

                // STEP 4: 내 글에 [댓글 쓰기]
                const commentExpandBtn = myFeedItem.querySelector('button.sc-feed-comment-editor-form-button');
                if (commentExpandBtn) commentExpandBtn.click();

                await new Promise(r => setTimeout(r, 1000));

                const commentEditor = myFeedItem.querySelector('.sc-feed-comments-body div.fr-element.fr-view[contenteditable="true"]');
                if (commentEditor) {
                    commentEditor.innerHTML = '<p>참여 완료</p>';
                    commentEditor.dispatchEvent(new Event('input', { bubbles: true }));
                    commentEditor.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
                }

                await new Promise(r => setTimeout(r, 800));

                const commentSubmitBtn = myFeedItem.querySelector('button.sc-feed-comment-editor-submit-button');
                if (commentSubmitBtn && !commentSubmitBtn.disabled) {
                    commentSubmitBtn.click();

                    GM_setValue('triggerReward', true);

                    setTimeout(() => {
                        window.close();
                    }, 1500);
                }

            }, 1500);
        }
    }
})();
