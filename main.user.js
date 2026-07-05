// ==UserScript==
// @name         New STOVE Daily Mission Automation Script
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  온스토브 리워드 이벤트 페이지 및 새 탭 자동화 스크립트
// @author       You
// @match        https://reward.onstove.com/ko*
// @match        https://*.onstove.com/*
// @icon         https://reward.onstove.com/favicon.ico
// @updateURL    https://raw.githubusercontent.com/TellurideX/New-STOVE-Daily-Mission-Automation-Script/main/main.user.js
// @downloadURL  https://raw.githubusercontent.com/TellurideX/New-STOVE-Daily-Mission-Automation-Script/main/main.user.js
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        window.close
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href;
    const decodedUrl = decodeURI(currentUrl);

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
                btnText, 
                isRunnable: btnText === '미션하기' && !button.disabled 
            };
        }

        async function executeMissionLogic() {
            let clickedCount = 0;

            for (const name of ["365일 특가 게임 구경하기", "MY홈 방문하기", "스토브 메인 방문하기"]) {
                const state = getMissionState(name);
                if (state && state.isRunnable) {
                    GM_setValue('autoRunExpire', Date.now() + 15000); 
                    state.button.click(); 
                    clickedCount++;
                    await new Promise(r => setTimeout(r, 300));
                }
            }

            await new Promise(r => setTimeout(r, 200));

            for (const name of ["라운지 좋아요 누르기", "라운지 댓글 쓰기", "라운지 글쓰기"]) {
                const state = getMissionState(name); 
                if (state && state.isRunnable) {
                    GM_setValue('autoRunExpire', Date.now() + 15000); 
                    GM_openInTab('https://lounge.onstove.com/feed/%ED%94%8C%EB%A0%88%EC%9D%B4%ED%81%AC%EB%AF%B8%EC%85%98', { active: true });
                    clickedCount++;
                    break; 
                }
            }

            if (clickedCount === 0) {
                await claimAllRewards();
            }
        }

        async function claimAllRewards() {
            const buttons = document.querySelectorAll('button');
            let claimCount = 0;

            for (const btn of buttons) {
                if (btn.innerText.trim() === '받기' && !btn.disabled) {
                    btn.click();
                    claimCount++;
                    await new Promise(r => setTimeout(r, 500)); 
                }
            }
        }

        createAutomationButton();

        if (GM_getValue('triggerReward', false)) {
            GM_setValue('triggerReward', false); 
            
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
                    location.reload(); 
                }
            }, 1000);
        }
    } 
    
    else if (decodedUrl.includes('/feed/플레이크미션')) {
        const expireTime = GM_getValue('autoRunExpire', 0);
        if (Date.now() < expireTime) {
            GM_setValue('autoRunExpire', 0); 

            setTimeout(async () => {
                const targetTitle = '플레이크 미션 참여';

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

                const likeBtn = myFeedItem.querySelector('button.sc-feed-detail-like-button');
                if (likeBtn) likeBtn.click();

                await new Promise(r => setTimeout(r, 1000));

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
