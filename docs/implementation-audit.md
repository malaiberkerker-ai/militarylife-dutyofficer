# 實作盤點與本輪取捨

## 既有專案
- Vite、原生JavaScript ES modules、Three.js；入口src/main.js，未改成React或TypeScript。
- engine.js保留清晨狀態與restoreState驗證；range-day.js、inspection.js、phone-event.js、arrival-event.js各有純函式規則及獨立UI。
- world.js與camp-world.js提供場景、碰撞、近距離互動，100人名冊位於camp.js。
- 過去使用單一localStorage鍵duty-officer-prototype-v1，邏輯state.version為1，部分章節有舊欄位補值；沒有完整的升版前備份。
- 舊有35項測試繼續保留；本輪增至48項。

## 本輪新增
- save-store.js將既有鍵內資料升為saveVersion=2封套，邏輯state.version仍為1，避免全面重寫章節。
- 遷移先存before-v2原文，再寫新格式；previous保留前次有效存檔。失敗時停止寫入；未知新版本及損壞主檔保留，改由玩家明確匯入或恢復。
- 匯入、恢復前分別另存before-import與before-recovery；UI可匯出這些原檔。回退到舊程式前，應先下載升版前備份，因舊程式不認識v2封套。
- morning-data.js定義三件工作、工時、期限、可用人員及選擇效果；morning.js以純函式處理分工、並行、截止、結算、追問。
- morning-ui.js提供待辦、現場班長與連長對話，以及營部電話。morale為士氣；fatigue由100-energy導出；負荷依剩餘工時及逾期推算。
- 固定seed影響統計期限（09:25或09:30），seed及結果存在存檔，重新整理不換結果。

## 範圍與風險
- 共同時鐘先限定在可獨立試玩的上午章節，09:00至10:00工作、10:15追問；原章節暫停，結束恢復原位置與原章節的時間顯示，不回填舊章節排程。
- 委派工作隨處置與跨區移動推進，本人作業需按作業5或10分鐘；實際走動、閱讀、選單及背景停留不耗遊戲分鐘。
- 人力為你、吳文書、協調後的陳班長，每人同時一件；沒有改動全連100人名冊，也沒有把100位NPC逐幀跑排程。
- 只新增班長協作／推責記憶，沒有宣稱完成完整NPC關係網、跨日生涯或16張事件卡。
- 原插曲在上午活動期間暫緩，避免計時與任務互相打斷；舊章節的獨立入口保留。
- 靜態公開部署，不新增AI、帳號、付費服務或伺服器。


## 正式日接續更新
- morning.mode區分formal／standalone；無mode的舊存檔視為獨立上午。已完成舊獨立上午於正式接續時保存在morningDemoArchive。
- 勤務繁重日stage4清晨交接完成後提供正式接續；載入已完成清晨的舊檔也可接上，不重新扣分或重設早點名成果。
- 正式日10:15回覆後進入aftercare，原任務物件與人力延續，可處理待辦到11:00；handover才結束本段，仍保留660分鐘及原地點。
- 獨立上午使用不同SAVE_KEY後綴morning-trial，包含它自己的備份，與正式日互不覆寫。
- navigation.js提供有界限的網格尋路；world.js處理射線點選、目的地圈、自動靠近與碰撞；main.js統一鍵盤接管、暫停及近距離互動。每次點選才計算路線，不逐幀重新搜尋。
- 隨機到任自動插曲延後至正式午前交接後；其他日型及手動插曲入口保留。

