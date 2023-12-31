// 페이지 로딩 후 작동해야 하는 코드라 window.onload를 이용하였습니다.
// html파일에서 js 링크를 body 하단부에 작성하면 window.onload를 사용하지 않아도 됩니다.
window.onload = function () {

    // 위,경도 값을 기상청에서 사용하는 격자정보로 변환하는 function입니다.
    // 기상청에서 제공하는 날씨정보 API는 격자값을 사용해서 필요합니다.
    // 매개변수 v1과 v2는 위도와 경도값입니다.
    function dfs_xy_conv(v1, v2) {
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
    function displayLocation(position) {
        latlon.y = position.coords.latitude; // 위도
        latlon.x = position.coords.longitude; // 경도
        mapinit();
    }

    var lat = 35.1741212; // 초기값, 전대후문
    var lon = 126.9135834;  // 초기값, 전대후문
    var latlon = { y: lat, x: lon };

    var map = []; // 메인 지도창, 주소 설정 지도창
    // 지도를 생성하는 function입니다.
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
    // 마커를 생성하는 function입니다.
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

    // 카카오 카테고리 검색 rest api, 좌표값은 주지 않아서 지도를 띄우려면 주소->좌표 변환이 필요합니다.
    function categorySerch(latlon, rad) {
        arr_address_name = [];  // 주소
        arr_place_url = []; // 식당 정보 페이지 url
        arr_category_name = []; // 카테고리 풀네임
        arr_category_name_1 = [];   // 카테고리 첫번 째 항목
        arr_category_name_2 = [];   // 카테고리 두번 째 항목

        var j = 0;
        var cateRun = true; // 아래의 while문을 돌리기 위해 사용, while의 종료 조건이 if문에 있어서 while(true)와 if문에 break를 걸면 break가 안걸릴 수 있다고 판단하여 문법 오류 발생
        var cateNum = 0;    // 총 검색 개수를 반환하기 위해 선언
        while (cateRun) { // page 1~10번 받기
            j++;
            $.ajax({
                method: "GET",
                url: "https://dapi.kakao.com/v2/local/search/category.json?category\_group\_code=FD6&page=" + j + "&x=" + latlon.x + "&y=" + latlon.y + "&radius=" + rad + "",
                headers: { Authorization: "KEY" },  // 카카오 developers에서 발급받은 API key를 입력해주세요.
                async: false // ajax 2개 이상 사용시 필요
            })
                .done(function (msg) {
                    cateNum += msg.documents.length;    // 검색 된 수만큼 값 추가
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
        document.getElementById('count').innerHTML = "0 / " + cateNum;  // 총 검색 수를 메인화면에 출력하기 위한 구문

        // 검색 된 항목들 셔플, 동일 지역에서 같은 날씨인 경우 항상 추천해주는 식당의 순서가 같아서 높은 점수의 식당을 우선 추천하되 순서는 섞어준다.
        var temp;
        for (let i = 0; i < arr_address_name.length; i++) {
            var tempNum = Math.floor(Math.random()*cateNum);

            temp = arr_address_name[i];
            arr_address_name[i] = arr_address_name[tempNum];
            arr_address_name[tempNum] = temp;

            temp = arr_place_url[i];
            arr_place_url[i] = arr_place_url[tempNum];
            arr_place_url[tempNum] = temp;

            temp = arr_category_name[i];
            arr_category_name[i] = arr_category_name[tempNum];
            arr_category_name[tempNum] = temp;

            temp = arr_category_name_1[i];
            arr_category_name_1[i] = arr_category_name_1[tempNum];
            arr_category_name_1[tempNum] = temp;

            temp = arr_category_name_2[i];
            arr_category_name_2[i] = arr_category_name_2[tempNum];
            arr_category_name_2[tempNum] = temp;

        }
    }


    // 주소-좌표 변환 객체를 생성합니다
    var geocoder = new kakao.maps.services.Geocoder();

    // 식당 정보(url)을 화면에 띄워주고 지도에 해당 식당을 표시해주는 function입니다.
    function reco(recoNum) {

        // url을 iframe으로 화면에 띄워줍니다.
        // iframe은 페이지에 내부에 다른 html페이지를 포함시키는 태그입니다. 사용하지 않는것을 권고하니 주의가 필요합니다.
        document.querySelector('#box_child1').innerHTML = "<iframe src='" + arr_place_url[recoNum] + "'></iframe>";

        // 주소로 좌표를 검색합니다
        geocoder.addressSearch(arr_address_name[recoNum], function (result, status) {
            // 정상적으로 검색이 완료됐으면 
            if (status === kakao.maps.services.Status.OK) {

                // 결과값으로 받은 위치를 마커로 표시합니다
                displayMarker(result[0], 0);
                
                // 지도의 중심을 결과값으로 받은 위치로 이동시킵니다
                var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                map[0].setCenter(coords);
            }
        });
    }

    // 좌표로 주소를 반환하여 페이지에 출력하는 function입니다.
    function coo2add(latlng, id) {
        geocoder.coord2Address(latlng.x, latlng.y, function (result, status) {
            if (status === kakao.maps.services.Status.OK) { // 정상적으로 검색이 완료됐으면 
                document.getElementById(id).value = result[0].address.address_name;
            }
        });
    }
    
    var radio_para = 600;   // 검색할 반경 초기값은 600m

    // 초기 세팅 function입니다. 사이트 진입 시 현 위치값을 받은 후, 주소 검색으로 중심 좌표가 바뀔 때, 옵션 변경할 때 필요한 function들을 모아뒀습니다.
    function mapinit() {
        document.getElementById('box_child1').style.backgroundImage = "url('/imges/main_WeatherLoading.png')";  // 로딩 중 이미지 출력
        displayMarker(latlon, 0);   // 메인화면 지도에 마커 표시
        map[0].setCenter(new kakao.maps.LatLng(latlon.y, latlon.x));    // 메인화면 지도 중심변경
        categorySerch(latlon, radio_para);  // 식당 검색
        getWeather(dfs_xy_conv(latlon.y, latlon.x));    // 날씨 검색
        coo2add(latlon, 'modal_btn');   // 메인화면에 주소 표시
    }

    // 기상청의 날씨 검색 API을 $.getJSON을 이용해 호출하는 function입니다.
    function getWeather(xy) {


        // getJSON으로 데이터를 반환받으려면 url에 날짜, 시간, 좌표를 써주어야합니다. 정해진 형식대로 써주어야 하기에 날짜와 시간을 형식에 맞게 변환해야합니다.
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

        var hours = today.getHours(); // 시간
        // 현재 시간이 00시인경우 이전 날짜로 검색해야합니다.
        if (hours == 0) {
            hours = 24;
            date--;
        }

        todayString += date;

        hours--;  // (기상청에서 제공하는 데이터의 업데이트가 느릴 수 있어서 1시간 전 데이터로 변경)
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
            // serviceKey=KEY 부분에는 발급받은 실제 key를 입력해야합니다.
            "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=KEY&pageNo=1&numOfRows=1000&dataType=JSON&base_date=" + todayString + "&base_time=" + currentTime + "&nx=" + xy.x + "&ny=" + xy.y + "",
            function (data) {
                iconInit(data); // 아이콘 생성
                scoreInit(data);
                document.getElementById('box_child1').style.backgroundImage = "url('/imges/main_search2.jpg')";
                document.getElementById('main_count').innerHTML = cateNum;
                thisCount = 0;
                document.getElementById('count').innerHTML = thisCount + " / " + cateNum;
            }
        );
    }

    // 메인화면에 현재 날씨의 아이콘을 출력하는 function입니다.
    function iconInit(data){
        var weather = "";
        if (data.response.body.items.item[18].fcstValue == 1) { // 맑음
            document.getElementById('body').style.backgroundImage = 'url(../imges/sun.jpg)';
            weather = "sun";
        } else if (data.response.body.items.item[6].fcstValue == 1 || data.response.body.items.item[6].fcstValue == 2 || data.response.body.items.item[6].fcstValue == 5 || data.response.body.items.item[6].fcstValue == 6) {  // 비
            document.getElementById('body').style.backgroundImage = 'url(../imges/rain.jpg)';
            weather = "umbrella";
        } else if (data.response.body.items.item[6].fcstValue == 3 || data.response.body.items.item[6].fcstValue == 7) {  // 눈
            document.getElementById('body').style.backgroundImage = 'url(../imges/snow2.jpg)';
            weather = "snowflake";
        } else {  // 흐림
            document.getElementById('body').style.backgroundImage = 'url(../imges/cloudy.jpg)';
            weather = "cloud";
        }
        // 부트스트랩을 이용해 아이콘을 생성합니다.
        document.getElementById('weather').innerHTML = '<i class="fa-solid fa-' + weather + ' fa-fade fa-sm"></i>';
    }

    var arr_score = []; // 검색된 식당 각각에 해당되는 점수 배열 선언 

    // 날씨에 따라 음식에 점수를 부여하는 function입니다. 개발자 임의로 특정 카테고리에 일정 점수를 부여했습니다.
    // ai를 학습하시는 분이라면 검증된 데이터로 점수를 부여하도록 수정해보면 좋을 것 같습니다.
    function scoreInit(data) {
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
        // 검색된 수 만큼 점수 배열에 0 넣기 
        for (i = 0; i < cateNum; i++) {
            arr_score[i] = 0;
        }
        // 검색값을 순회하며 날씨에 따라 일정 점수를 부여
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
    }

    var thisCount = 0;  // 몇 번 검색했는지 나타낼 변수입니다.

    // arr_score에서 가장 높은 값을 갖는 index를 찾는 function입니다.
    function max_arr_score() {
        var maxScore = arr_score[0];    // 가장 높은 값을 저장하는 변수
        var maxScoreIndex = 0;  // 가장 높은 값의 index를 저장하는 변수
        for (i in arr_score){
            if (maxScore < arr_score[i]){
                maxScore = arr_score[i];
                maxScoreIndex = i;
            }
        }

        if (maxScore == -1){
            return -1;
        } else {
            arr_score[maxScoreIndex] = -1; // 다시 검색하지 않게 -1로 변경
            thisCount++;
            document.getElementById('count').innerHTML = thisCount + " / " + cateNum;
            return maxScoreIndex;
        }
    }

    // 메인화면에서 추천버튼을 눌렀을 때 작동하는 function입니다. 날씨에 따라 추천합니다. (default)
    function randomWeather() {
        document.getElementById('box_child1').style.backgroundImage = "none";
        var recoNum = max_arr_score(); // 가장 높은 점수의 식당 번호를 추출
        if (recoNum == -1) { // 모든 식당을 추출한 경우
            document.getElementById('box_child1').innerHTML = null;
            document.getElementById('box_child1').style.backgroundImage = "url('/imges/main_end.jpg')";
        }
        else { reco(recoNum); } // url값 넣기 
    }
    document.getElementById('random_button').addEventListener('click', randomWeather);

    // 메인화면에서 추천버튼을 눌렀을 때 작동하는 function입니다. 랜덤으로 추천합니다.
    function randomGo() {
        document.getElementById('box_child1').style.backgroundImage = "none";
        var recoNum = Math.floor(Math.random() * cateNum);  // 랜덤으로 식당 번호를 추출
        reco(recoNum);
    }


    // 주소 검색창 열기
    function addSearchOn() {
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
    document.getElementById('modal_btn').addEventListener('click', addSearchOn);

    // 주소 검색창 닫기
    function addSearchOff() {
        document.querySelector('.modal_wrap').style.display = 'none';
        document.querySelector('.black_bg').style.display = 'none';
    }
    document.querySelector('.modal_close').addEventListener('click', addSearchOff);

    // 주소 검색 버튼
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
    document.getElementById('complete_search_btn').addEventListener('click', address_search);


    // 옵션 모달창 
    function optionOn() {
        document.querySelector('.modal_wrap2').style.display = 'block';
        document.querySelector('.black_bg2').style.display = 'block';
    }
    document.getElementById('option_btn').addEventListener('click', optionOn);

    function optionOff() {
        document.querySelector('.modal_wrap2').style.display = 'none';
        document.querySelector('.black_bg2').style.display = 'none';
    }
    document.querySelector('.modal_close2').addEventListener('click', optionOff);

    
    // 옵션 완료 버튼
    function complete_option() {
        document.getElementById('box_child1').innerHTML = null;
        document.getElementById('box_child1').innerHTML = '<div id="main_count"></div>';
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
            mapinit();
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
