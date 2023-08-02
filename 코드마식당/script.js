window.onload = function () {
    function dfs_xy_conv(v1, v2) {
        //
        // LCC DFS 좌표변환 ( code : "toXY"(위경도->좌표, v1:위도, v2:경도), "toLL"(좌표->위경도,v1:x, v2:y) )
        //
        var DEGRAD = Math.PI / 180.0;

        var re = 6371.00877 / 5.0;  // 지구 반경 / 격자 간격 (km)
        var slat1 = 30.0 * DEGRAD;  // 투영 위도1(degree)
        var slat2 = 60.0 * DEGRAD;  // 투영 위도2(degree)
        var olon = 126.0 * DEGRAD;   // 기준점 경도(degree)
        var olat = 38.0 * DEGRAD;   // 기준점 위도(degree)

        var sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
        var sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
        var ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
        ro = re * sf / Math.pow(ro, sn);
        var rs = {};

        var ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        var theta = v2 * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;
        rs['x'] = Math.floor(ra * Math.sin(theta) + 43 + 0.5);  // 43 : 기준점 X좌표(GRID)
        rs['y'] = Math.floor(ro - ra * Math.cos(theta) + 136 + 0.5); // 136 : 기준점 Y좌표(GRID)

        return rs;
    }

    //geolocation을 받아 올 수 있나 확인하는 if구문
    if (navigator.geolocation) {
        //geolocation을 이용해 접속 위치를 얻어오기
        navigator.geolocation.getCurrentPosition(displayLocation);
    }

    var lat = 35.1741212; // 초기값, 전대후문
    var lon = 126.9135834;  // 초기값, 전대후문
    var latlon = { y: lat, x: lon };
    // var xy = dfs_xy_conv(lat, lon);

    var map = []; // 메인 지도창, 주소 설정 지도창

    function mapCreate(id, lv, num) {
        var mapContainer = document.getElementById(id), // 지도를 표시할 div 
            mapOption = {
                center: new kakao.maps.LatLng(latlon.y, latlon.x), // 지도의 중심좌표
                level: lv // 지도의 확대 레벨
            };

        // 지도를 생성합니다    
        map[num] = new kakao.maps.Map(mapContainer, mapOption);
    }

    mapCreate('mapBox', 2, 0);

    var imageSrc = 'imges/maker.png', // 마커이미지의 주소입니다    
        imageSize = new kakao.maps.Size(70, 70), // 마커이미지의 크기입니다
        imageOption = { offset: new kakao.maps.Point(27, 69) }; // 마커이미지의 옵션입니다. 마커의 좌표와 일치시킬 이미지 안에서의 좌표를 설정합

    var marker = [];  // main지도 마커, 주소창 마커

    function makerCreate(num) {
        marker[num] = new kakao.maps.Marker({
            map: map[num],
            position: new kakao.maps.LatLng(latlon.y, latlon.x),
            image: new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption)
        });
    }

    makerCreate(0); // 기존 마커 없애기를 구현하기 위해 marker 초기화

    // 지도에 마커를 표시하는 함수입니다
    function displayMarker(place, num) {
        marker[num].setMap(null);  // 기존 마커 없애기
        // 마커를 생성하고 지도에 표시합니다
        marker[num] = new kakao.maps.Marker({
            map: map[0],
            position: new kakao.maps.LatLng(place.y, place.x),
            image: new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption)
        });
    }

    var arr_address_name = [];  // 주소
    var arr_place_url = [];  // url
    var arr_category_name = []; // 카테고리 full name
    var arr_category_name_1 = []; // 카테고리 항목 1
    var arr_category_name_2 = []; // 카테고리 항목 2
    var cateNum = 0;

    // 지도 + 카테고리 검색 rest api
    function categorySerch(latlon, rad) {
        arr_address_name = [];  // 배열 초기화
        arr_place_url = [];
        arr_category_name = [];
        arr_category_name_1 = [];
        arr_category_name_2 = [];

        var j = 0;
        var cateRun = true;
        var initNum = 0;
        while (cateRun) { // page 1~10번 받기
            j++;
            $.ajax({
                method: "GET",
                url: "https://dapi.kakao.com/v2/local/search/category.json?category\_group\_code=FD6&page=" + j + "&x=" + latlon.x + "&y=" + latlon.y + "&radius=" + rad + "",
                headers: { Authorization: "KakaoAK 9fc095edb70a6304836b3a8f6b980ab8" },
                async: false // ajax 2개 이상 사용시 필요
            })
                .done(function (msg) {
                    initNum = msg.documents.length;
                    for (var i = 0; i < msg.documents.length; i++) {
                        arr_address_name.push(msg.documents[i].address_name); // 주소에 값 추가
                        arr_place_url.push(msg.documents[i].place_url); // url에 값 추가
                        arr_category_name = msg.documents[i].category_name.split(" > ");  // 카테고리 full name을 찢어서 저장
                        arr_category_name_1.push(arr_category_name[1]); // 카테고리 항목 1에 값 추가
                        arr_category_name_2.push(arr_category_name[2]); // 카테고리 항목 2에 값 추가
                    }
                    if (msg.meta.is_end) {
                        cateRun = false;
                    }
                });
        }
        cateNum = j * initNum;
    }


    // 주소-좌표 변환 객체를 생성합니다
    var geocoder = new kakao.maps.services.Geocoder();

    function but(urlnum) {
        document.querySelector('#box_child1').innerHTML = "<iframe src='" + arr_place_url[urlnum] + "'></iframe>";
        // 주소로 좌표를 검색합니다
        geocoder.addressSearch(arr_address_name[urlnum], function (result, status) {

            // 정상적으로 검색이 완료됐으면 
            if (status === kakao.maps.services.Status.OK) {

                var coords = new kakao.maps.LatLng(result[0].y, result[0].x);

                // 결과값으로 받은 위치를 마커로 표시합니다
                displayMarker(result[0], 0);

                // 지도의 중심을 결과값으로 받은 위치로 이동시킵니다
                map[0].setCenter(coords);
            }
        });
    }

    function coo2add(latlng, id) {
        geocoder.coord2Address(latlng.x, latlng.y, function (result, status) {
            if (status === kakao.maps.services.Status.OK) { // 정상적으로 검색이 완료됐으면 
                document.getElementById(id).value = result[0].address.address_name;
            }
        });
    }

    var radio_para = 600;
    function displayLocation(position) {
        latlon.y = position.coords.latitude; // 위도
        latlon.x = position.coords.longitude; // 경도
        mapinit();
    }

    function mapinit() {
        displayMarker(latlon, 0);
        map[0].setCenter(new kakao.maps.LatLng(latlon.y, latlon.x));
        categorySerch(latlon, radio_para);
        getWeather(dfs_xy_conv(latlon.y, latlon.x));
        coo2add(latlon, 'modal_btn');
        document.getElementById('box_child1').innerHTML = null;
        document.getElementById('box_child1').style.backgroundImage = "url('/imges/main.jpg')";
    }

    // 날씨 api
    function getWeather(xy) {

        var today = new Date(); // Date객체

        var year = today.getFullYear(); // 년
        var month = today.getMonth() + 1;  // 월
        var date = today.getDate();  // 일
        var todayString = '' + year; // 현 날짜 변수 ('20230723' 형식으로 표현)

        if (month < 10) {  // month가 한자리 수 일 때 0 추가 (07월)
            todayString += '0';
        }
        todayString += month;
        if (date < 10) {  // date가 한자리 수 일 때 0 추가 (07일)
            todayString += '0';
        }

        var hours = today.getHours(); // 시
        if (hours == 0) {
            hours = 24;
            date--;
        }

        todayString += date;

        hours--;  // (업데이트 느릴 수 있어서 1시간 전 데이터로 변경)
        var minutes = today.getMinutes();  // 분
        var currentTime = '';  // 현 시간 변수 ('0705' 형식으로 표현)
        if (hours < 10) {
            currentTime += '0';
        }
        currentTime += hours;
        if (minutes < 10) {
            currentTime += '0';
        }
        currentTime += minutes;

        $.getJSON(
            "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=WUQsY6Sq8A%2FnvtZJqZjLhgqNL5Fg5tVdT0c4WPWJ%2F%2F0UXSkpD7r2C3yppDZbv07LBlzbYY%2FyoT7KNLTpfQwAPA%3D%3D&pageNo=1&numOfRows=1000&dataType=JSON&base_date=" + todayString + "&base_time=" + currentTime + "&nx=" + xy.x + "&ny=" + xy.y + "",
            function (data) {

                var weatherInnerHTML = "";  // 오늘의 날씨 아이콘 입력값

                if (data.response.body.items.item[18].fcstValue == 1) { // 맑음
                    document.getElementById('body').style.backgroundImage = 'url(../imges/sun.jpg)';
                    weatherInnerHTML = "sun";
                } else if (data.response.body.items.item[6].fcstValue == 1 || data.response.body.items.item[6].fcstValue == 2 || data.response.body.items.item[6].fcstValue == 5 || data.response.body.items.item[6].fcstValue == 6) {  // 비
                    document.getElementById('body').style.backgroundImage = 'url(../imges/rain.jpg)';
                    weatherInnerHTML = "umbrella";
                } else if (data.response.body.items.item[6].fcstValue == 3 || data.response.body.items.item[6].fcstValue == 7) {  // 눈
                    document.getElementById('body').style.backgroundImage = 'url(../imges/snow2.jpg)';
                    weatherInnerHTML = "snowflake";
                } else {  // 흐림
                    document.getElementById('body').style.backgroundImage = 'url(../imges/cloudy.jpg)';
                    weatherInnerHTML = "cloud";
                }
                document.getElementById('weather').innerHTML = '<i class="fa-solid fa-' + weatherInnerHTML + ' fa-fade fa-sm"></i>'; // 오늘의 날씨 아이콘 생성
                scoreInit();
                scoreAdd(data);
            }
        );
    }

    // 주소 모달창

    function onClick() {
        document.querySelector('.modal_wrap').style.display = 'block';
        document.querySelector('.black_bg').style.display = 'block';
        document.getElementById('search_address').value = null;
        // 주소 검색창 지도 띄우기
        mapCreate('search_map', 5, 1);
        // 마커 띄우기
        makerCreate(1);

        // 지도에 클릭 이벤트를 등록합니다
        kakao.maps.event.addListener(map[1], 'click', function (mouseEvent) {
            var ll = mouseEvent.latLng;
            // 마커 위치를 클릭한 위치로 옮깁니다
            marker[1].setPosition(ll);
            // var message = '클릭한 위치의 위도는 ' + latlng.getLat() + ' 이고, ';
            // message += '경도는 ' + latlng.getLng() + ' 입니다';
            var latlng = {};
            latlng['x'] = ll.getLng();
            latlng['y'] = ll.getLat();
            coo2add(latlng, 'search_address');
        });
    }
    function offClick() {
        document.querySelector('.modal_wrap').style.display = 'none';
        document.querySelector('.black_bg').style.display = 'none';
    }
    function address_search() {
        if (document.getElementById('search_address').value == "") {
            return;
        }
        geocoder.addressSearch(document.getElementById('search_address').value, function (result, status) {
            // 정상적으로 검색이 완료됐으면 
            if (status === kakao.maps.services.Status.OK) {
                latlon.y = result[0].y;
                latlon.x = result[0].x;
                mapinit();
            }
        });
        document.querySelector('.modal_wrap').style.display = 'none';
        document.querySelector('.black_bg').style.display = 'none';
    }
    document.getElementById('modal_btn').addEventListener('click', onClick);
    document.querySelector('.modal_close').addEventListener('click', offClick);
    document.getElementById('complete_search_btn').addEventListener('click', address_search);

    // 옵션 모달창 
    //  -> 주소 모달창에서 이름만 조금 바꿔서 똑같이 만들었더니 이것만 먹히고 주소 모달창이 안 먹혀요..!  이 부분은 너무 어려워서 손을 못 댔습니다 도와주세용..
    // window.onload가 2개 있어서 아래 있는것만 적용되서 주소창이 안눌렸던거라 기존 window.onload 안에 추가된 onClick,offClick을 넣어주고
    // 위에 onClick, offClick이 있으니 이름을 살짝 바꿔준 뒤
    function onClick2() {
        document.querySelector('.modal_wrap2').style.display = 'block';
        document.querySelector('.black_bg2').style.display = 'block';
    }
    function offClick2() {
        document.querySelector('.modal_wrap2').style.display = 'none';
        document.querySelector('.black_bg2').style.display = 'none';
    }

    // 해당되는 id나 class를 눌렀을때 위 함수가 적용되게 바꿔준 이름으로 아래를 수정
    document.getElementById('option_btn').addEventListener('click', onClick2);
    document.querySelector('.modal_close2').addEventListener('click', offClick2);


    // 태균

    var arr_score; // 점수 배열 선언 
    var arr_score_from = [];
    var arr_menu = [ // 메뉴 배열 선언 26개 
        "해물,생선", // 0 
        "양꼬치",  //1
        "국밥", // 2
        "한정식", // 3
        "초밥,롤",// 4
        "일본식라면", //5 
        "일본식주점", //6
        "버거킹", //7 
        "국수", // 8
        "호프,요리주점", //9
        "제과,베이커리", // 10
        "육류,고기", //11
        "떡볶이", // 12
        "인도음식", // 13
        "맥도날드", // 14 
        "동남아음식", // 15
        "감자탕", // 16
        "곰탕", // 17
        "일식집", // 18
        "피자", // 19
        "교촌치킨", //20
        "BHC치킨", // 21
        "퓨전한식", // 22
        "샌드위치", // 23
        "아이스크림", // 24
        "맘스터치" // 25
    ];
    function scoreInit() {
        arr_score = []; // 초기화
        for (i = 0; i < cateNum; i++) {
            arr_score[i] = 0;   // 점수 배열 150개에 0 넣기 
        }
    }
    function scoreAdd(data) { //  날씨에 따른 음식 추천 함수 
        for (i = 0; i < cateNum; i++) {
            if (data.response.body.items.item[24].fcstValue >= 27) {  // 27도 이상이면 
                if (arr_category_name_2[i] == arr_menu[8] || arr_category_name_2[i] == arr_menu[15] || arr_category_name_2[i] == arr_menu[24] || arr_category_name_2[i] == arr_menu[13]) { arr_score[i] += 3; } //더운 날씨에 어울리는 음식 3점 부여
            }

            if (data.response.body.items.item[24].fcstValue <= 26 || data.response.body.items.item[24].fcstValue >= 20) { // 날씨 20~26도
                if (arr_category_name_2[i] == arr_menu[4] || arr_category_name_2[i] == arr_menu[7] || arr_category_name_2[i] == arr_menu[10] || arr_category_name_2[i] == arr_menu[11] || arr_category_name_2[i] == arr_menu[12] || arr_category_name_2[i] == arr_menu[14]
                    || arr_category_name_2[i] == arr_menu[18] || arr_category_name_2[i] == arr_menu[19] || arr_category_name_2[i] == arr_menu[20] || arr_category_name_2[i] == arr_menu[21] || arr_category_name_2[i] == arr_menu[22] || arr_category_name_2[i] == arr_menu[23] || arr_category_name_2[i] == arr_menu[25]) {
                    arr_score[i] += 3;
                } // 선선한 날씨에 어울리는 음식에 3점 부여 
            }

            if (data.response.body.items.item[24].fcstValue <= 19) {
                if (arr_category_name_2[i] == arr_menu[0] || arr_category_name_2[i] == arr_menu[1] || arr_category_name_2[i] == arr_menu[2] || arr_category_name_2[i] == arr_menu[5] || arr_category_name_2[i] == arr_menu[6] || arr_category_name_2[i] == arr_menu[9] || arr_category_name_2[i] == arr_menu[16] || arr_category_name_2[i] == arr_menu[17]) {
                    arr_score[i] += 3;
                } // 추운 날씨에 어울리는 음식 3점 부여 
            }


            if (data.response.body.items.item[6].fcstValue == 0) {
                if (arr_category_name_2[i] == arr_menu[3] || arr_category_name_2[i] == arr_menu[4] || arr_category_name_2[i] == arr_menu[7] || arr_category_name_2[i] == arr_menu[10] || arr_category_name_2[i] == arr_menu[14] || arr_category_name_2[i] == arr_menu[18] || arr_category_name_2[i] == arr_menu[19] || arr_category_name_2[i] == arr_menu[22] || arr_category_name_2[i] == arr_menu[23] || arr_category_name_2[i] == arr_menu[25]) { arr_score[i] += 1; }
                // 강수 없을 때 1점 부여
            }

            else if (arr_category_name_2[i] == arr_menu[2] || arr_category_name_2[i] == arr_menu[5] || arr_category_name_2[i] == arr_menu[6] || arr_category_name_2[i] == arr_menu[9] || arr_category_name_2[i] == arr_menu[16] || arr_category_name_2[i] == arr_menu[17]) { arr_score[i] += 2; }
            // 비나 눈 올때 2점 부여
        }
        arr_score_from = Array.from(new Set(arr_score)); // 중복값 제외 전역변수 설정 
        arr_score_from.sort((a, b) => b - a); // 내림차순 정렬
    }
    function numberRoom() { // score배열 내림차순(큰값부터)으로 방 번호 찾는 함수 
        while (true) {
            if (arr_score_from.length) { // num배열 길이만큼 slice할때마다 길이가 줄어듬 
                for (i in arr_score) { // score 배열 길이 만큼 반복
                    if (arr_score_from[0] == arr_score[i]) { // num 0번에 해당하는 score배열을 찾으면?
                        arr_score[i] = -1; // 다시 검색하지 않게 -1로 변경
                        return i; // score 방번호 출력
                    }
                }
                arr_score_from.splice(0, 1); // num [0] 없애고 num[1]이 num=[0]으로 바뀜
                continue; // 그리고 계속하기...
            }
            return -1;
        }
    }
    function randomWeather() { // 날씨가 적용 됐을 때 함수
        var url_Weather = numberRoom(); // url에 numberRoom index값 넣기
        if (url_Weather == -1) { // urlWeather 방을 아예 못찾았을때는 
            document.getElementById('box_child1').innerHTML = null;
            document.getElementById('box_child1').style.backgroundImage = "url('/imges/main_end.jpg')";
        }
        else { but(url_Weather); } // url값 넣기 
    }

    function randomGo() {
        var urlran = Math.floor(Math.random() * cateNum);
        but(urlran);
    }

    document.getElementById('random_button').addEventListener('click', randomWeather);

    // 옵션 완료 버튼
    function complete_option() {
        document.querySelector('.modal_wrap2').style.display = 'none';
        document.querySelector('.black_bg2').style.display = 'none';
        if (document.getElementById('randomm').checked) {
            document.getElementById('random_button').removeEventListener('click', randomWeather);
            document.getElementById('random_button').addEventListener('click', randomGo);
        } else {
            document.getElementById('random_button').removeEventListener('click', randomGo);
            document.getElementById('random_button').addEventListener('click', randomWeather);
        }
        if (radio_para != document.getElementById('position').value) {
            radio_para = document.getElementById('position').value;
            mapinit(latlon, radio_para);
        }
        for (i = 0; i < cateNum; i++) {
            if (!document.getElementById('koreanFood').checked && arr_category_name_1[i] == "한식") {
                arr_score[i] = -1;
            } else if (document.getElementById('koreanFood').checked && arr_score[i] == -1) {
                arr_score[i] = 0;
            }
            if (!document.getElementById('koreanFood').checked && arr_category_name_1[i] == "일식") {
                arr_score[i] = -1;
            } else if (document.getElementById('koreanFood').checked && arr_score[i] == -1) {
                arr_score[i] = 0;
            }
            if (!document.getElementById('koreanFood').checked && arr_category_name_1[i] == "중식") {
                arr_score[i] = -1;
            } else if (document.getElementById('koreanFood').checked && arr_score[i] == -1) {
                arr_score[i] = 0;
            }
            if (!document.getElementById('koreanFood').checked && arr_category_name_1[i] == "양식") {
                arr_score[i] = -1;
            } else if (document.getElementById('koreanFood').checked && arr_score[i] == -1) {
                arr_score[i] = 0;
            }
            if (!document.getElementById('koreanFood').checked && arr_category_name_1[i] == "분식") {
                arr_score[i] = -1;
            } else if (document.getElementById('koreanFood').checked && arr_score[i] == -1) {
                arr_score[i] = 0;
            }
        }
    }
    document.getElementById('complete_option_btn').addEventListener('click', complete_option);
};