
## :blue_book: 프로젝트 요약
날씨에 따라 맞춤형 식당을 추천해주는 사이트입니다.

[사이트 바로가기](https://cmkj0314.neocities.org/)

---

## :clock3: 개발 기간
* 23.07.24 ~ 23.8.06

---

## :orange_book: 프로젝트 소개

![오늘 뭐 먹지 소개 1](https://github.com/KSJ0314/codemasickdang/assets/132119447/97d1cd33-f624-416e-b039-25c3aaba6018)
![오늘 뭐 먹지 소개 2](https://github.com/KSJ0314/codemasickdang/assets/132119447/5e3f0299-12ba-4b79-9473-5d80d5d259a6)
![오늘 뭐 먹지 소개 3](https://github.com/KSJ0314/codemasickdang/assets/132119447/bcac43fc-80aa-48de-ba24-54c143d369a2)

---

## :star: 추가 사항

* 보완 기간 : 23.08.10~23.08.17

1. README 작성

2. Main Box 이미지 수정
![본선 보완 사항 2](https://github.com/KSJ0314/codemasickdang/assets/132119447/31da93c2-a542-4631-a5fb-b5c95f0ccc7d)

3. 로딩 표시
![본선 보완 사항 3](https://github.com/KSJ0314/codemasickdang/assets/132119447/32db7263-6c04-4a76-bcb6-91e1f9dd4f03)

4. 출력한 식당 / 검색된 식당의 수 표시
![본선 보완 사항 1](https://github.com/KSJ0314/codemasickdang/assets/132119447/581c6c75-758e-41e6-9c3d-1bcad83c0d86)

5. 같은 지역, 같은 날씨인 경우 항상 같은 순서로 식당이 출력되는 문제 해결
   : 검색된 식당을 동일 점수끼리 셔플하여 해결
     (지도 + 카테고리 검색 rest api function인 categorySerch() 내부에서 셔플 구현)
   ```JavaScript
         var temp;
         for (i in arr_address_name) {
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
   ```
