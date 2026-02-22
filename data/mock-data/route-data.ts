import { TransportationMode } from "@/types/buildingTypes";

export const mockRoutes: Record<TransportationMode, any[]> = {
  walking: [
    {
      "bounds": {
        "northeast": {
          "lat": 45.5098254,
          "lng": -73.5537541
        },
        "southwest": {
          "lat": 45.5019992,
          "lng": -73.5770613
        }
      },
      "copyrights": "Powered by Google, ©2026 Google",
      "legs": [
        {
          "distance": {
            "text": "2.7 km",
            "value": 2692
          },
          "duration": {
            "text": "37 mins",
            "value": 2233
          },
          "end_address": "275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
          "end_location": {
            "lat": 45.5087012,
            "lng": -73.5537541
          },
          "start_address": "859 Rue Sherbrooke O, Montréal, QC H3A 2K6, Canada",
          "start_location": {
            "lat": 45.5049357,
            "lng": -73.5770613
          },
          "steps": [
            {
              "distance": {
                "text": "0.2 km",
                "value": 227
              },
              "duration": {
                "text": "3 mins",
                "value": 171
              },
              "end_location": {
                "lat": 45.5038203,
                "lng": -73.5747367
              },
              "html_instructions": "Head \u003Cb\u003Esoutheast\u003C/b\u003E toward \u003Cb\u003ERte 138 E\u003C/b\u003E",
              "polyline": {
                "points": "{tvtGroa`M@?Ne@Ri@N]HGEQz@wBrAeDHO@ELOCC"
              },
              "start_location": {
                "lat": 45.5049357,
                "lng": -73.5770613
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.4 km",
                "value": 350
              },
              "duration": {
                "text": "5 mins",
                "value": 292
              },
              "end_location": {
                "lat": 45.5019992,
                "lng": -73.5710163
              },
              "html_instructions": "Continue onto \u003Cb\u003EAv. McGill College\u003C/b\u003E",
              "polyline": {
                "points": "{mvtGbaa`MNc@tAeDHWnAaD@Gx@sBFMRk@Ri@@A|@aC"
              },
              "start_location": {
                "lat": 45.5038203,
                "lng": -73.5747367
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "1.0 km",
                "value": 1045
              },
              "duration": {
                "text": "14 mins",
                "value": 847
              },
              "end_location": {
                "lat": 45.5098254,
                "lng": -73.5638556
              },
              "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003ERue Sainte-Catherine O\u003C/b\u003E",
              "maneuver": "turn-left",
              "polyline": {
                "points": "obvtGzi``MwAwAQO_A_AOMm@m@OQIIAASQWW][ACMKSSgAcAKMMIkAiAMKuBcBKKe@_@KKWSKIsAiAOM@GwAmA{@w@OMUS_@YeA}@mAcA{@w@MIQMQO]Y]WoAeAKIc@_@]Y"
              },
              "start_location": {
                "lat": 45.5019992,
                "lng": -73.5710163
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.8 km",
                "value": 755
              },
              "duration": {
                "text": "11 mins",
                "value": 654
              },
              "end_location": {
                "lat": 45.5061728,
                "lng": -73.5557389
              },
              "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E onto \u003Cb\u003EBoul. Saint-Laurent\u003C/b\u003E",
              "maneuver": "turn-right",
              "polyline": {
                "points": "mswtGb}~_Mz@aCl@eBHQPe@Xy@FMVu@He@RW`@gA?Cx@_Cb@oAFQhA{C?A^cALa@@EJWBIDMFODMBIFOFUFOFORk@Vy@LWFUTs@BMN_@@EFMH[`@sAPk@"
              },
              "start_location": {
                "lat": 45.5098254,
                "lng": -73.5638556
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.3 km",
                "value": 315
              },
              "duration": {
                "text": "4 mins",
                "value": 269
              },
              "end_location": {
                "lat": 45.5087012,
                "lng": -73.5537541
              },
              "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the left\u003C/div\u003E",
              "maneuver": "turn-left",
              "polyline": {
                "points": "q|vtGjj}_MWGs@e@IGqAeAQKEEu@i@OKQKYUMKKIeAy@KKYUaAu@"
              },
              "start_location": {
                "lat": 45.5061728,
                "lng": -73.5557389
              },
              "travel_mode": "WALKING"
            }
          ],
          "traffic_speed_entry": [],
          "via_waypoint": []
        }
      ],
      "overview_polyline": {
        "points": "{tvtGroa`Mt@mBHGEQnC}GJULOCCdBiExAyDvAuDTk@|@aCwAwAqAoA}@{@o@o@{DsDyAuAaCoBuAiAcBwA@GwAmAkAeAu@m@}EcE_BoA}CiCdC_H`@gAVu@He@RW`@gAx@cCtB_Gz@cCb@oAj@aBd@qA\\iA\\aAj@oBPk@WG}@m@cBqA}AgAaF}D"
      },
      "summary": "Rue Sainte-Catherine O and Boul. Saint-Laurent",
      "warnings": [
        "Walking directions are in beta. Use caution – This route may be missing sidewalks or pedestrian paths."
      ],
      "waypoint_order": []
    },
    {
      "bounds": {
        "northeast": {
          "lat": 45.5089658,
          "lng": -73.5537541
        },
        "southwest": {
          "lat": 45.5032622,
          "lng": -73.5770613
        }
      },
      "copyrights": "Powered by Google, ©2026 Google",
      "legs": [
        {
          "distance": {
            "text": "2.7 km",
            "value": 2675
          },
          "duration": {
            "text": "37 mins",
            "value": 2214
          },
          "end_address": "275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
          "end_location": {
            "lat": 45.5087012,
            "lng": -73.5537541
          },
          "start_address": "859 Rue Sherbrooke O, Montréal, QC H3A 2K6, Canada",
          "start_location": {
            "lat": 45.5049357,
            "lng": -73.5770613
          },
          "steps": [
            {
              "distance": {
                "text": "0.2 km",
                "value": 227
              },
              "duration": {
                "text": "3 mins",
                "value": 171
              },
              "end_location": {
                "lat": 45.5038203,
                "lng": -73.5747367
              },
              "html_instructions": "Head \u003Cb\u003Esoutheast\u003C/b\u003E toward \u003Cb\u003ERte 138 E\u003C/b\u003E",
              "polyline": {
                "points": "{tvtGroa`M@?Ne@Ri@N]HGEQz@wBrAeDHO@ELOCC"
              },
              "start_location": {
                "lat": 45.5049357,
                "lng": -73.5770613
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.1 km",
                "value": 98
              },
              "duration": {
                "text": "2 mins",
                "value": 95
              },
              "end_location": {
                "lat": 45.5032622,
                "lng": -73.5736122
              },
              "html_instructions": "Continue onto \u003Cb\u003EAv. McGill College\u003C/b\u003E",
              "polyline": {
                "points": "{mvtGbaa`MNc@tAeDHW"
              },
              "start_location": {
                "lat": 45.5038203,
                "lng": -73.5747367
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.7 km",
                "value": 690
              },
              "duration": {
                "text": "9 mins",
                "value": 550
              },
              "end_location": {
                "lat": 45.5083134,
                "lng": -73.5686857
              },
              "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003EAv. du Président-Kennedy\u003C/b\u003E",
              "maneuver": "turn-left",
              "polyline": {
                "points": "kjvtG`z``MsBqBGQYQeA}@OMACKKCC}AyASSqAyAIOmAkAUK}@y@MSsAsAoBoBQQw@q@_@[gA_A"
              },
              "start_location": {
                "lat": 45.5032622,
                "lng": -73.5736122
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.3 km",
                "value": 310
              },
              "duration": {
                "text": "4 mins",
                "value": 241
              },
              "end_location": {
                "lat": 45.5067848,
                "lng": -73.5655158
              },
              "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E onto \u003Cb\u003ERue Jeanne-Mance\u003C/b\u003E",
              "maneuver": "turn-right",
              "polyline": {
                "points": "}iwtGh{_`MXu@HKTi@HUbAiCFQj@{AXy@@ETk@@[FQPONa@Vs@"
              },
              "start_location": {
                "lat": 45.5083134,
                "lng": -73.5686857
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.1 km",
                "value": 127
              },
              "duration": {
                "text": "2 mins",
                "value": 103
              },
              "end_location": {
                "lat": 45.5061782,
                "lng": -73.5641844
              },
              "html_instructions": "Continue straight to stay on \u003Cb\u003ERue Jeanne-Mance\u003C/b\u003E",
              "maneuver": "straight",
              "polyline": {
                "points": "k`wtGng_`MBWTo@Rk@NSBINa@DO^gA"
              },
              "start_location": {
                "lat": 45.5067848,
                "lng": -73.5655158
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.4 km",
                "value": 352
              },
              "duration": {
                "text": "5 mins",
                "value": 291
              },
              "end_location": {
                "lat": 45.5089658,
                "lng": -73.5617227
              },
              "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003EBoul. René-Lévesque O S\u003C/b\u003E",
              "maneuver": "turn-left",
              "polyline": {
                "points": "s|vtGb__`MMKuDeDIIiB}ASQaCsBKI_As@SM"
              },
              "start_location": {
                "lat": 45.5061782,
                "lng": -73.5641844
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.6 km",
                "value": 556
              },
              "duration": {
                "text": "8 mins",
                "value": 504
              },
              "end_location": {
                "lat": 45.5062904,
                "lng": -73.555695
              },
              "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E onto \u003Cb\u003EBoul. Saint-Laurent\u003C/b\u003E",
              "maneuver": "turn-right",
              "polyline": {
                "points": "anwtGvo~_MR]Fa@`@iA@Cx@_C`@mAFQjA_D^gAJ[BIJUBIDK?AFODM?ABGFOHYL[Rk@Pm@N]JYV_ADKJY@EBCFWd@}ANc@"
              },
              "start_location": {
                "lat": 45.5089658,
                "lng": -73.5617227
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.3 km",
                "value": 315
              },
              "duration": {
                "text": "4 mins",
                "value": 259
              },
              "end_location": {
                "lat": 45.5087012,
                "lng": -73.5537541
              },
              "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the left\u003C/div\u003E",
              "maneuver": "turn-left",
              "polyline": {
                "points": "i}vtGbj}_Ms@e@IGqAeAQKEEu@i@OKQKYUMKKIeAy@KKYUaAu@"
              },
              "start_location": {
                "lat": 45.5062904,
                "lng": -73.555695
              },
              "travel_mode": "WALKING"
            }
          ],
          "traffic_speed_entry": [],
          "via_waypoint": []
        }
      ],
      "overview_polyline": {
        "points": "{tvtGroa`Mt@mBHGEQnC}GJULOCCdBiEHWsBqBGQYQuAkAoBmBeBmBIOmAkAUK}@y@MSsAsAaCaCwAmAgA_AXu@^u@`CmGZ_ATk@@[FQPOf@uAXgARk@NSRk@d@wAwHyGuCeCkA}@SMR]Fa@`@iAz@cCh@_BvBcGf@wAb@mA`AqClBiG}@m@cBqA}AgAaF}D"
      },
      "summary": "Av. du Président-Kennedy",
      "warnings": [
        "Walking directions are in beta. Use caution – This route may be missing sidewalks or pedestrian paths."
      ],
      "waypoint_order": []
    },
    {
      "bounds": {
        "northeast": {
          "lat": 45.5088446,
          "lng": -73.5537541
        },
        "southwest": {
          "lat": 45.5032622,
          "lng": -73.5770613
        }
      },
      "copyrights": "Powered by Google, ©2026 Google",
      "legs": [
        {
          "distance": {
            "text": "2.7 km",
            "value": 2671
          },
          "duration": {
            "text": "37 mins",
            "value": 2216
          },
          "end_address": "275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
          "end_location": {
            "lat": 45.5087012,
            "lng": -73.5537541
          },
          "start_address": "859 Rue Sherbrooke O, Montréal, QC H3A 2K6, Canada",
          "start_location": {
            "lat": 45.5049357,
            "lng": -73.5770613
          },
          "steps": [
            {
              "distance": {
                "text": "0.2 km",
                "value": 227
              },
              "duration": {
                "text": "3 mins",
                "value": 171
              },
              "end_location": {
                "lat": 45.5038203,
                "lng": -73.5747367
              },
              "html_instructions": "Head \u003Cb\u003Esoutheast\u003C/b\u003E toward \u003Cb\u003ERte 138 E\u003C/b\u003E",
              "polyline": {
                "points": "{tvtGroa`M@?Ne@Ri@N]HGEQz@wBrAeDHO@ELOCC"
              },
              "start_location": {
                "lat": 45.5049357,
                "lng": -73.5770613
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.1 km",
                "value": 98
              },
              "duration": {
                "text": "2 mins",
                "value": 95
              },
              "end_location": {
                "lat": 45.5032622,
                "lng": -73.5736122
              },
              "html_instructions": "Continue onto \u003Cb\u003EAv. McGill College\u003C/b\u003E",
              "polyline": {
                "points": "{mvtGbaa`MNc@tAeDHW"
              },
              "start_location": {
                "lat": 45.5038203,
                "lng": -73.5747367
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.7 km",
                "value": 690
              },
              "duration": {
                "text": "9 mins",
                "value": 550
              },
              "end_location": {
                "lat": 45.5083134,
                "lng": -73.5686857
              },
              "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003EAv. du Président-Kennedy\u003C/b\u003E",
              "maneuver": "turn-left",
              "polyline": {
                "points": "kjvtG`z``MsBqBGQYQeA}@OMACKKCC}AyASSqAyAIOmAkAUK}@y@MSsAsAoBoBQQw@q@_@[gA_A"
              },
              "start_location": {
                "lat": 45.5032622,
                "lng": -73.5736122
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.3 km",
                "value": 310
              },
              "duration": {
                "text": "4 mins",
                "value": 241
              },
              "end_location": {
                "lat": 45.5067848,
                "lng": -73.5655158
              },
              "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E onto \u003Cb\u003ERue Jeanne-Mance\u003C/b\u003E",
              "maneuver": "turn-right",
              "polyline": {
                "points": "}iwtGh{_`MXu@HKTi@HUbAiCFQj@{AXy@@ETk@@[FQPONa@Vs@"
              },
              "start_location": {
                "lat": 45.5083134,
                "lng": -73.5686857
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.4 km",
                "value": 431
              },
              "duration": {
                "text": "6 mins",
                "value": 351
              },
              "end_location": {
                "lat": 45.5046894,
                "lng": -73.5608127
              },
              "html_instructions": "Continue straight to stay on \u003Cb\u003ERue Jeanne-Mance\u003C/b\u003E",
              "maneuver": "straight",
              "polyline": {
                "points": "k`wtGng_`MBWTo@X{@FAMMBIFQFQFM^gAHc@L]DK\\_AHSRk@nAiDTo@DOh@wABKVs@TWTm@"
              },
              "start_location": {
                "lat": 45.5067848,
                "lng": -73.5655158
              },
              "travel_mode": "WALKING"
            },
            {
              "building_level": {
                "number": 1
              },
              "distance": {
                "text": "0.1 km",
                "value": 96
              },
              "duration": {
                "text": "1 min",
                "value": 77
              },
              "end_location": {
                "lat": 45.5042307,
                "lng": -73.5597753
              },
              "html_instructions": "Walk for 96m",
              "polyline": {
                "points": "isvtG`j~_MzAmE"
              },
              "start_location": {
                "lat": 45.5046894,
                "lng": -73.5608127
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "17 m",
                "value": 17
              },
              "duration": {
                "text": "1 min",
                "value": 14
              },
              "end_location": {
                "lat": 45.5042008,
                "lng": -73.559622
              },
              "html_instructions": "Head \u003Cb\u003Esoutheast\u003C/b\u003E toward \u003Cb\u003ERue Saint-Antoine O\u003C/b\u003E",
              "polyline": {
                "points": "mpvtGrc~_MFUAI"
              },
              "start_location": {
                "lat": 45.5042307,
                "lng": -73.5597753
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.5 km",
                "value": 465
              },
              "duration": {
                "text": "7 mins",
                "value": 408
              },
              "end_location": {
                "lat": 45.5077468,
                "lng": -73.5565445
              },
              "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003ERue Saint-Antoine O\u003C/b\u003E",
              "maneuver": "turn-left",
              "polyline": {
                "points": "gpvtGrb~_MHYu@k@IGYWGKg@a@UImCqBIQUQQWkA_A_@YaAy@WKYS_@UWQYQMIWOMKIG"
              },
              "start_location": {
                "lat": 45.5042008,
                "lng": -73.559622
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "10 m",
                "value": 10
              },
              "duration": {
                "text": "1 min",
                "value": 9
              },
              "end_location": {
                "lat": 45.5077398,
                "lng": -73.556527
              },
              "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E",
              "maneuver": "turn-right",
              "polyline": {
                "points": "mfwtGjo}_M@A"
              },
              "start_location": {
                "lat": 45.5077468,
                "lng": -73.5565445
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "19 m",
                "value": 19
              },
              "duration": {
                "text": "1 min",
                "value": 21
              },
              "end_location": {
                "lat": 45.5077892,
                "lng": -73.5562979
              },
              "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003ETake the stairs\u003C/div\u003E",
              "maneuver": "turn-left",
              "polyline": {
                "points": "kfwtGho}_MCQE["
              },
              "start_location": {
                "lat": 45.5077398,
                "lng": -73.556527
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.1 km",
                "value": 133
              },
              "duration": {
                "text": "2 mins",
                "value": 108
              },
              "end_location": {
                "lat": 45.5088446,
                "lng": -73.5554982
              },
              "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E",
              "maneuver": "turn-left",
              "polyline": {
                "points": "ufwtGzm}_MUQ_@W_Ao@s@e@g@_@"
              },
              "start_location": {
                "lat": 45.5077892,
                "lng": -73.5562979
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.1 km",
                "value": 133
              },
              "duration": {
                "text": "2 mins",
                "value": 136
              },
              "end_location": {
                "lat": 45.5083727,
                "lng": -73.5540229
              },
              "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E toward \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003ETake the stairs\u003C/div\u003E",
              "maneuver": "turn-right",
              "polyline": {
                "points": "gmwtGzh}_M@KLo@Jg@@Q?EDM@GBGJa@Ty@Pq@"
              },
              "start_location": {
                "lat": 45.5088446,
                "lng": -73.5554982
              },
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "42 m",
                "value": 42
              },
              "duration": {
                "text": "1 min",
                "value": 35
              },
              "end_location": {
                "lat": 45.5087012,
                "lng": -73.5537541
              },
              "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the left\u003C/div\u003E",
              "maneuver": "turn-left",
              "polyline": {
                "points": "ijwtGr_}_MaAu@"
              },
              "start_location": {
                "lat": 45.5083727,
                "lng": -73.5540229
              },
              "travel_mode": "WALKING"
            }
          ],
          "traffic_speed_entry": [],
          "via_waypoint": []
        }
      ],
      "overview_polyline": {
        "points": "{tvtGroa`Mt@mBHGEQnC}GJULOCCdBiEHWsBqBGQYQuAkAoBmBeBmBIOmAkAUK}@y@MSsAsAaCaCwAmAgA_AXu@^u@`CmGZ_ATk@@[FQPOf@uAXgAX{@FAMMBINc@f@uAHc@L]b@kA\\_AtCaIZ_ATWTm@bBcFAIHY_As@a@c@g@a@UImCqBIQg@i@kByAaAy@WKy@i@wA}@WSASE[UQ_BgA{AeAN{@RmAf@kBPq@aAu@"
      },
      "summary": "Av. du Président-Kennedy and Rue Jeanne-Mance",
      "warnings": [
        "Walking directions are in beta. Use caution – This route may be missing sidewalks or pedestrian paths."
      ],
      "waypoint_order": []
    }
  ],
  transit: [
    {
      "bounds": {
        "northeast": {
          "lat": 45.5087012,
          "lng": -73.5518911
        },
        "southwest": {
          "lat": 45.498722,
          "lng": -73.579678
        }
      },
      "copyrights": "Powered by Google, ©2026 Google",
      "legs": [
        {
          "arrival_time": {
            "text": "7:08 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771632514
          },
          "departure_time": {
            "text": "6:38 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771630705
          },
          "distance": {
            "text": "4.3 km",
            "value": 4322
          },
          "duration": {
            "text": "30 mins",
            "value": 1809
          },
          "end_address": "275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
          "end_location": {
            "lat": 45.5087012,
            "lng": -73.5537541
          },
          "start_address": "859 Rue Sherbrooke O, Montréal, QC H3A 2K6, Canada",
          "start_location": {
            "lat": 45.504957,
            "lng": -73.5771037
          },
          "steps": [
            {
              "distance": {
                "text": "0.4 km",
                "value": 380
              },
              "duration": {
                "text": "6 mins",
                "value": 386
              },
              "end_location": {
                "lat": 45.5033294,
                "lng": -73.5796477
              },
              "html_instructions": "Walk to Peel / Du Docteur-Penfield",
              "polyline": {
                "points": "_uvtGzoa`MAFCBAFARAF?P?RVZNNl@h@@@@?@?@Ad@kAHH@@@@FDDBBBBBNPXT\\ZCHYb@GNCFBDCHAJ^XLJ^^DJ`@x@N\\LHKZDF"
              },
              "start_location": {
                "lat": 45.504957,
                "lng": -73.5771037
              },
              "steps": [
                {
                  "distance": {
                    "text": "39 m",
                    "value": 39
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 35
                  },
                  "end_location": {
                    "lat": 45.5050248,
                    "lng": -73.5775323
                  },
                  "html_instructions": "Head \u003Cb\u003Enorthwest\u003C/b\u003E",
                  "polyline": {
                    "points": "_uvtGzoa`MAFCBAFARAF?P?R"
                  },
                  "start_location": {
                    "lat": 45.504957,
                    "lng": -73.5771037
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.1 km",
                    "value": 108
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 88
                  },
                  "end_location": {
                    "lat": 45.5043596,
                    "lng": -73.5775842
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E toward \u003Cb\u003ERue McTavish\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "kuvtGpra`MVZNNl@h@@@@?@?@Ad@kA"
                  },
                  "start_location": {
                    "lat": 45.5050248,
                    "lng": -73.5775323
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "68 m",
                    "value": 68
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 71
                  },
                  "end_location": {
                    "lat": 45.5038203,
                    "lng": -73.578084
                  },
                  "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E toward \u003Cb\u003ERue McTavish\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003ETake the stairs\u003C/div\u003E",
                  "maneuver": "turn-right",
                  "polyline": {
                    "points": "gqvtGzra`MHH@@@@FDDBBBBBNPXT\\Z"
                  },
                  "start_location": {
                    "lat": 45.5043596,
                    "lng": -73.5775842
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "35 m",
                    "value": 35
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 46
                  },
                  "end_location": {
                    "lat": 45.5040257,
                    "lng": -73.5784282
                  },
                  "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E onto \u003Cb\u003ERue McTavish\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003ETake the stairs\u003C/div\u003E",
                  "maneuver": "turn-right",
                  "polyline": {
                    "points": "{mvtG~ua`MCHYb@GNCF"
                  },
                  "start_location": {
                    "lat": 45.5038203,
                    "lng": -73.578084
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "16 m",
                    "value": 16
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 18
                  },
                  "end_location": {
                    "lat": 45.5040359,
                    "lng": -73.5785747
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E to stay on \u003Cb\u003ERue McTavish\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003ETake the stairs\u003C/div\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "eovtGdxa`MBDCHAJ"
                  },
                  "start_location": {
                    "lat": 45.5040257,
                    "lng": -73.5784282
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.1 km",
                    "value": 114
                  },
                  "duration": {
                    "text": "2 mins",
                    "value": 128
                  },
                  "end_location": {
                    "lat": 45.5033294,
                    "lng": -73.5796477
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003EAv. du Docteur-Penfield\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the right\u003C/div\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "govtG`ya`M^XLJ^^DJ`@x@N\\LHKZDF"
                  },
                  "start_location": {
                    "lat": 45.5040359,
                    "lng": -73.5785747
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "3.7 km",
                "value": 3667
              },
              "duration": {
                "text": "19 mins",
                "value": 1148
              },
              "end_location": {
                "lat": 45.507069,
                "lng": -73.552124
              },
              "html_instructions": "Bus towards Est",
              "polyline": {
                "points": "akvtG~_b`MII@CHSTi@Na@N_@JUPg@DKNa@^_A^aAFQp@aBPc@HMFQFKFIBEVWqAoAw@u@h@uAj@}ArAmDL[\\}@BGr@cBBKf@mA^cAL]jAgDJWN_@DMh@mAj@yAL]HMFMRa@ZOgCyBMKuBqBiAcA{CoCWUkBkBs@a@OKOGYODUDSH[p@mBVu@Tq@Tu@DODQ?ADWBe@LeAFk@Rm@@CLg@Ri@\\cAPm@L_@X}@Rm@@CZ_AHWJYL_@J_@{@cASM`@uA?AL]Li@Po@Nq@n@kC\\yAf@wBH_@b@gBLi@Nm@Lk@r@yCTcANm@T_A\\sAj@aCT}@@G@G?E_@@E?aBFO?I@G@G@E?A@G@GBE@IFKFYRYTWNGDGBE@IBOBgAV[HUD_@Ha@FOBM@I@A?M@w@Bq@BQ@{@DkBDU@Q@e@G_@IKCy@UQEICyA]YIQESGiAa@q@SGCSGUIQGOGkCaBWOMEc@QBQ"
              },
              "start_location": {
                "lat": 45.503373,
                "lng": -73.579678
              },
              "transit_details": {
                "arrival_stop": {
                  "location": {
                    "lat": 45.507069,
                    "lng": -73.552124
                  },
                  "name": "De la Commune / Jacques-Cartier"
                },
                "arrival_time": {
                  "text": "7:03 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771632239
                },
                "departure_stop": {
                  "location": {
                    "lat": 45.503373,
                    "lng": -73.579678
                  },
                  "name": "Peel / Du Docteur-Penfield"
                },
                "departure_time": {
                  "text": "6:44 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771631091
                },
                "headsign": "Est",
                "line": {
                  "agencies": [
                    {
                      "name": "Société de transport de Montréal",
                      "phone": "1 (514) 786-4636",
                      "url": "https://www.stm.info/"
                    }
                  ],
                  "color": "#009ee0",
                  "name": "Vieux-Montréal / Vieux-Port",
                  "short_name": "50",
                  "text_color": "#ffffff",
                  "vehicle": {
                    "icon": "//maps.gstatic.com/mapfiles/transit/iw2/6/bus2.png",
                    "name": "Bus",
                    "type": "BUS"
                  }
                },
                "num_stops": 13
              },
              "travel_mode": "TRANSIT"
            },
            {
              "distance": {
                "text": "0.3 km",
                "value": 275
              },
              "duration": {
                "text": "5 mins",
                "value": 274
              },
              "end_location": {
                "lat": 45.5087012,
                "lng": -73.5537541
              },
              "html_instructions": "Walk to 275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
              "polyline": {
                "points": "gbwtGxs|_M[MYMg@SGXGV?@Oj@ELK`@Wx@K\\Mb@EJc@vAK`@IVaAu@"
              },
              "start_location": {
                "lat": 45.5070812,
                "lng": -73.5521317
              },
              "steps": [
                {
                  "distance": {
                    "text": "55 m",
                    "value": 55
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 45
                  },
                  "end_location": {
                    "lat": 45.5075499,
                    "lng": -73.5518911
                  },
                  "html_instructions": "Head \u003Cb\u003Enorth\u003C/b\u003E on \u003Cb\u003ERue Commune\u003C/b\u003E toward \u003Cb\u003EPl. Jacques-Cartier\u003C/b\u003E",
                  "polyline": {
                    "points": "gbwtGxs|_M[MYMg@S"
                  },
                  "start_location": {
                    "lat": 45.5070812,
                    "lng": -73.5521317
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.2 km",
                    "value": 178
                  },
                  "duration": {
                    "text": "3 mins",
                    "value": 184
                  },
                  "end_location": {
                    "lat": 45.5083745,
                    "lng": -73.5540215
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003EPl. Jacques-Cartier\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "eewtGhr|_MGXGV?@Oj@ELK`@Wx@K\\Mb@EJc@vAK`@IV"
                  },
                  "start_location": {
                    "lat": 45.5075499,
                    "lng": -73.5518911
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "42 m",
                    "value": 42
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 45
                  },
                  "end_location": {
                    "lat": 45.5087012,
                    "lng": -73.5537541
                  },
                  "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E onto \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the left\u003C/div\u003E",
                  "maneuver": "turn-right",
                  "polyline": {
                    "points": "ijwtGr_}_MaAu@"
                  },
                  "start_location": {
                    "lat": 45.5083745,
                    "lng": -73.5540215
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            }
          ],
          "traffic_speed_entry": [],
          "via_waypoint": []
        }
      ],
      "overview_polyline": {
        "points": "_uvtGzoa`MEJCZAX?RVZ|@x@B@BAd@kAHHBBTPh@f@\\ZCHa@r@?LETl@d@d@j@p@vALHKZDFGDII@C^}@|@_CtAoDtAeDZm@VWqAoAw@u@h@uA~BkGj@yAbBeEdCaHjBuEVk@Zo@ZOgCyBcC}BeFsEcCaCmBeAJi@z@iChAmDDSH}@TqBTq@~@uC`CoHX_A{@cASM`@wAZgAnBgIbBiHvE{RXsAwCH_@DWHiAx@m@Z}Bh@gBZ_FTaCFQ@e@Gk@MkA[oCq@wCaAkAa@cDqBq@W@Ou@[g@SGXGXy@tCcAdDUx@aAu@"
      },
      "summary": "",
      "warnings": [
        "Walking directions are in beta. Use caution – This route may be missing sidewalks or pedestrian paths."
      ],
      "waypoint_order": []
    },
    {
      "bounds": {
        "northeast": {
          "lat": 45.509552,
          "lng": -73.5537541
        },
        "southwest": {
          "lat": 45.5032094,
          "lng": -73.5771037
        }
      },
      "copyrights": "Powered by Google, ©2026 Google",
      "legs": [
        {
          "arrival_time": {
            "text": "7:08 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771632504
          },
          "departure_time": {
            "text": "6:42 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771630934
          },
          "distance": {
            "text": "2.9 km",
            "value": 2855
          },
          "duration": {
            "text": "26 mins",
            "value": 1570
          },
          "end_address": "275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
          "end_location": {
            "lat": 45.5087012,
            "lng": -73.5537541
          },
          "start_address": "859 Rue Sherbrooke O, Montréal, QC H3A 2K6, Canada",
          "start_location": {
            "lat": 45.504957,
            "lng": -73.5771037
          },
          "steps": [
            {
              "distance": {
                "text": "0.6 km",
                "value": 607
              },
              "duration": {
                "text": "8 mins",
                "value": 496
              },
              "end_location": {
                "lat": 45.5094755,
                "lng": -73.5738617
              },
              "html_instructions": "Walk to Du Parc / Milton",
              "polyline": {
                "points": "_uvtGzoa`MIICCEEa@a@GLCDCDGFI@I?GCYMCACAEAOCGCG?EAE?E?C@E@CFIIUUWUSQOMWUKKo@k@[YMKIKMMSQEECAACEE_@_@KK}@w@w@u@IK]YWUMOOMYUABCFEHKMGG_@a@CEGEGEg@g@GL"
              },
              "start_location": {
                "lat": 45.504957,
                "lng": -73.5771037
              },
              "steps": [
                {
                  "distance": {
                    "text": "37 m",
                    "value": 37
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 29
                  },
                  "end_location": {
                    "lat": 45.5052323,
                    "lng": -73.5768306
                  },
                  "html_instructions": "Head \u003Cb\u003Enortheast\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003ETake the stairs\u003C/div\u003E",
                  "polyline": {
                    "points": "_uvtGzoa`MIICCEEa@a@"
                  },
                  "start_location": {
                    "lat": 45.504957,
                    "lng": -73.5771037
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.1 km",
                    "value": 146
                  },
                  "duration": {
                    "text": "2 mins",
                    "value": 114
                  },
                  "end_location": {
                    "lat": 45.506468,
                    "lng": -73.5764715
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E toward \u003Cb\u003ERue Milton\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "uvvtGdna`MGLCDCDGFI@I?GCYMCACAEAOCGCG?EAE?E?C@E@CFIIUUWUSQOM"
                  },
                  "start_location": {
                    "lat": 45.5052323,
                    "lng": -73.5768306
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.3 km",
                    "value": 321
                  },
                  "duration": {
                    "text": "4 mins",
                    "value": 267
                  },
                  "end_location": {
                    "lat": 45.5088151,
                    "lng": -73.5742461
                  },
                  "html_instructions": "Continue onto \u003Cb\u003ERue Milton\u003C/b\u003E",
                  "polyline": {
                    "points": "m~vtG|ka`MWUKKo@k@[YMKIKMMSQEECAACEE_@_@KK}@w@w@u@IK]YWUMOOMYU"
                  },
                  "start_location": {
                    "lat": 45.506468,
                    "lng": -73.5764715
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "8 m",
                    "value": 8
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 7
                  },
                  "end_location": {
                    "lat": 45.5088751,
                    "lng": -73.5743605
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003ERue Hutchison\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "cmwtG`~``MABCFEH"
                  },
                  "start_location": {
                    "lat": 45.5088151,
                    "lng": -73.5742461
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "83 m",
                    "value": 83
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 70
                  },
                  "end_location": {
                    "lat": 45.5094431,
                    "lng": -73.5737935
                  },
                  "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E onto \u003Cb\u003ERue Milton\u003C/b\u003E",
                  "maneuver": "turn-right",
                  "polyline": {
                    "points": "omwtGv~``MKMGG_@a@CEGEGEg@g@"
                  },
                  "start_location": {
                    "lat": 45.5088751,
                    "lng": -73.5743605
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "12 m",
                    "value": 12
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 9
                  },
                  "end_location": {
                    "lat": 45.5094755,
                    "lng": -73.5738617
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003EAv. du Parc\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "_qwtGd{``MGL"
                  },
                  "start_location": {
                    "lat": 45.5094431,
                    "lng": -73.5737935
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "2.0 km",
                "value": 2030
              },
              "duration": {
                "text": "12 mins",
                "value": 728
              },
              "end_location": {
                "lat": 45.509079,
                "lng": -73.555557
              },
              "html_instructions": "Bus towards Sud",
              "polyline": {
                "points": "gqwtGt{``MMMJYjAaDd@sAHQPk@p@iBDMXo@Vk@FQLYJYb@wADIHS~@{BVm@L_@HSJWNc@v@wBzAiEL_@Zy@Tk@Xu@DML[x@_CZy@HUL]Na@N[BIJWRm@d@oARe@|@eCHQLWL[d@iAJ[BKBIDORq@J[L]~@cCL_@{AmAaBqAcAw@a@_@o@g@aBoAcAw@e@]qAeA_@YmAgAc@W_@WWOYSCCg@[QKGEAA]Sk@_@s@k@YSEEa@Y[U_@WBM"
              },
              "start_location": {
                "lat": 45.509484,
                "lng": -73.573866
              },
              "transit_details": {
                "arrival_stop": {
                  "location": {
                    "lat": 45.509079,
                    "lng": -73.555557
                  },
                  "name": "Saint-Antoine / Gosford"
                },
                "arrival_time": {
                  "text": "7:04 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771632270
                },
                "departure_stop": {
                  "location": {
                    "lat": 45.509484,
                    "lng": -73.573866
                  },
                  "name": "Du Parc / Milton"
                },
                "departure_time": {
                  "text": "6:50 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771631440
                },
                "headsign": "Sud",
                "line": {
                  "agencies": [
                    {
                      "name": "Société de transport de Montréal",
                      "phone": "1 (514) 786-4636",
                      "url": "https://www.stm.info/"
                    }
                  ],
                  "color": "#009ee0",
                  "name": "Côte-Sainte-Catherine",
                  "short_name": "129",
                  "text_color": "#ffffff",
                  "vehicle": {
                    "icon": "//maps.gstatic.com/mapfiles/transit/iw2/6/bus2.png",
                    "name": "Bus",
                    "type": "BUS"
                  }
                },
                "num_stops": 8
              },
              "travel_mode": "TRANSIT"
            },
            {
              "distance": {
                "text": "0.2 km",
                "value": 218
              },
              "duration": {
                "text": "4 mins",
                "value": 212
              },
              "end_location": {
                "lat": 45.5087012,
                "lng": -73.5537541
              },
              "html_instructions": "Walk to 275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
              "polyline": {
                "points": "wnwtGfi}_M`@V@EFWBE@KLo@Jg@@Q?EDM@GBGJa@Ty@Pq@aAu@"
              },
              "start_location": {
                "lat": 45.5090806,
                "lng": -73.5555616
              },
              "steps": [
                {
                  "distance": {
                    "text": "21 m",
                    "value": 21
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 16
                  },
                  "end_location": {
                    "lat": 45.508915,
                    "lng": -73.5556838
                  },
                  "html_instructions": "Head \u003Cb\u003Esouthwest\u003C/b\u003E on \u003Cb\u003ERue Saint-Antoine E\u003C/b\u003E toward \u003Cb\u003EAv. de l'Hôtel-de-Ville\u003C/b\u003E",
                  "polyline": {
                    "points": "wnwtGfi}_M`@V"
                  },
                  "start_location": {
                    "lat": 45.5090806,
                    "lng": -73.5555616
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.2 km",
                    "value": 155
                  },
                  "duration": {
                    "text": "3 mins",
                    "value": 161
                  },
                  "end_location": {
                    "lat": 45.5083727,
                    "lng": -73.5540229
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E toward \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003ETake the stairs\u003C/div\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "umwtG~i}_M@EFWBE@KLo@Jg@@Q?EDM@GBGJa@Ty@Pq@"
                  },
                  "start_location": {
                    "lat": 45.508915,
                    "lng": -73.5556838
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "42 m",
                    "value": 42
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 35
                  },
                  "end_location": {
                    "lat": 45.5087012,
                    "lng": -73.5537541
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the left\u003C/div\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "ijwtGr_}_MaAu@"
                  },
                  "start_location": {
                    "lat": 45.5083727,
                    "lng": -73.5540229
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            }
          ],
          "traffic_speed_entry": [],
          "via_waypoint": []
        }
      ],
      "overview_polyline": {
        "points": "_uvtGzoa`MSSa@a@GLGJQHQC]Oa@KYAIBCFIIm@k@c@_@oBgBy@w@QQaDyCmAkAi@c@EJEHKMg@i@{@y@GNMMJYpBuFZ}@v@wBp@{AdA}CfBgEr@oB|D{KbAkC|CmIjCiHjAoCXaAlBoFL_@{AmAeDiCqAgAeDgCeFeEuBsAeAq@_@U_BkA}AiA_@WBM`@VNo@XwA@WV_Af@kBaAu@"
      },
      "summary": "",
      "warnings": [
        "Walking directions are in beta. Use caution – This route may be missing sidewalks or pedestrian paths."
      ],
      "waypoint_order": []
    },
    {
      "bounds": {
        "northeast": {
          "lat": 45.5152297,
          "lng": -73.5537541
        },
        "southwest": {
          "lat": 45.5028641,
          "lng": -73.5770613
        }
      },
      "copyrights": "Powered by Google, ©2026 Google",
      "legs": [
        {
          "arrival_time": {
            "text": "7:05 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771632335
          },
          "departure_time": {
            "text": "6:38 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771630723
          },
          "distance": {
            "text": "3.2 km",
            "value": 3231
          },
          "duration": {
            "text": "27 mins",
            "value": 1612
          },
          "end_address": "275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
          "end_location": {
            "lat": 45.5087012,
            "lng": -73.5537541
          },
          "start_address": "859 Rue Sherbrooke O, Montréal, QC H3A 2K6, Canada",
          "start_location": {
            "lat": 45.5049357,
            "lng": -73.5770613
          },
          "steps": [
            {
              "distance": {
                "text": "0.6 km",
                "value": 574
              },
              "duration": {
                "text": "8 mins",
                "value": 497
              },
              "end_location": {
                "lat": 45.504078,
                "lng": -73.571655
              },
              "html_instructions": "Walk to McGill",
              "polyline": {
                "points": "{tvtGroa`M@?Ne@Ri@N]HGEQz@wBrAeDHO@ELOCCNc@tAeDHWnAaDECQEg@g@IKSQEC?BoCuC"
              },
              "start_location": {
                "lat": 45.5049357,
                "lng": -73.5770613
              },
              "steps": [
                {
                  "distance": {
                    "text": "0.2 km",
                    "value": 227
                  },
                  "duration": {
                    "text": "3 mins",
                    "value": 171
                  },
                  "end_location": {
                    "lat": 45.5038203,
                    "lng": -73.5747367
                  },
                  "html_instructions": "Head \u003Cb\u003Esoutheast\u003C/b\u003E toward \u003Cb\u003ERte 138 E\u003C/b\u003E",
                  "polyline": {
                    "points": "{tvtGroa`M@?Ne@Ri@N]HGEQz@wBrAeDHO@ELOCC"
                  },
                  "start_location": {
                    "lat": 45.5049357,
                    "lng": -73.5770613
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.2 km",
                    "value": 180
                  },
                  "duration": {
                    "text": "3 mins",
                    "value": 153
                  },
                  "end_location": {
                    "lat": 45.5028641,
                    "lng": -73.5728
                  },
                  "html_instructions": "Continue onto \u003Cb\u003EAv. McGill College\u003C/b\u003E",
                  "polyline": {
                    "points": "{mvtGbaa`MNc@tAeDHWnAaD"
                  },
                  "start_location": {
                    "lat": 45.5038203,
                    "lng": -73.5747367
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "69 m",
                    "value": 69
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 53
                  },
                  "end_location": {
                    "lat": 45.5033562,
                    "lng": -73.5723762
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003EBlvd. De Maisonneuve Ouest\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the left\u003C/div\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "{gvtG~t``MECQEg@g@IKSQEC"
                  },
                  "start_location": {
                    "lat": 45.5028641,
                    "lng": -73.5728
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.1 km",
                    "value": 98
                  },
                  "duration": {
                    "text": "2 mins",
                    "value": 120
                  },
                  "end_location": {
                    "lat": 45.504078,
                    "lng": -73.571655
                  },
                  "html_instructions": "Take entrance \u003Cspan class=\"location\"\u003EMcGill - Édicule McGill College\u003C/span\u003E",
                  "polyline": {
                    "points": "_kvtGnr``MoCuC"
                  },
                  "start_location": {
                    "lat": 45.503365,
                    "lng": -73.572395
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "1.5 km",
                "value": 1502
              },
              "duration": {
                "text": "4 mins",
                "value": 240
              },
              "end_location": {
                "lat": 45.515213,
                "lng": -73.56105
              },
              "html_instructions": "Subway towards Station Honoré-Beaugrand",
              "polyline": {
                "points": "oovtGxm``MBK_YuRqPcUWUmXeVAABC"
              },
              "start_location": {
                "lat": 45.504078,
                "lng": -73.571655
              },
              "transit_details": {
                "arrival_stop": {
                  "location": {
                    "lat": 45.515213,
                    "lng": -73.56105
                  },
                  "name": "Berri-UQAM"
                },
                "arrival_time": {
                  "text": "6:51 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771631460
                },
                "departure_stop": {
                  "location": {
                    "lat": 45.504078,
                    "lng": -73.571655
                  },
                  "name": "McGill"
                },
                "departure_time": {
                  "text": "6:47 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771631220
                },
                "headsign": "Station Honoré-Beaugrand",
                "line": {
                  "agencies": [
                    {
                      "name": "Société de transport de Montréal",
                      "phone": "1 (514) 786-4636",
                      "url": "https://www.stm.info/"
                    }
                  ],
                  "color": "#00a556",
                  "name": "Ligne Verte",
                  "short_name": "1",
                  "text_color": "#000000",
                  "vehicle": {
                    "icon": "//maps.gstatic.com/mapfiles/transit/iw2/6/subway2.png",
                    "name": "Subway",
                    "type": "SUBWAY"
                  }
                },
                "num_stops": 3
              },
              "travel_mode": "TRANSIT"
            },
            {
              "distance": {
                "text": "1 m",
                "value": 0
              },
              "duration": {
                "text": "1 min",
                "value": 79
              },
              "end_location": {
                "lat": 45.515213,
                "lng": -73.56105
              },
              "html_instructions": "Walk to Berri-UQAM",
              "polyline": {
                "points": "auxtGpk~_M"
              },
              "start_location": {
                "lat": 45.515213,
                "lng": -73.56105
              },
              "steps": [
                {
                  "distance": {
                    "text": "1 m",
                    "value": 0
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 79
                  },
                  "end_location": {
                    "lat": 45.515213,
                    "lng": -73.56105
                  },
                  "polyline": {
                    "points": "auxtGpk~_M"
                  },
                  "start_location": {
                    "lat": 45.515213,
                    "lng": -73.56105
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.7 km",
                "value": 691
              },
              "duration": {
                "text": "2 mins",
                "value": 120
              },
              "end_location": {
                "lat": 45.5101481,
                "lng": -73.5563732
              },
              "html_instructions": "Subway towards Station Côte-Vertu",
              "polyline": {
                "points": "auxtGpk~_Mf_@yZ?ASk@"
              },
              "start_location": {
                "lat": 45.515213,
                "lng": -73.56105
              },
              "transit_details": {
                "arrival_stop": {
                  "location": {
                    "lat": 45.5101481,
                    "lng": -73.5563732
                  },
                  "name": "Champ-de-Mars"
                },
                "arrival_time": {
                  "text": "6:58 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771631880
                },
                "departure_stop": {
                  "location": {
                    "lat": 45.515213,
                    "lng": -73.56105
                  },
                  "name": "Berri-UQAM"
                },
                "departure_time": {
                  "text": "6:56 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771631760
                },
                "headsign": "Station Côte-Vertu",
                "line": {
                  "agencies": [
                    {
                      "name": "Société de transport de Montréal",
                      "phone": "1 (514) 786-4636",
                      "url": "https://www.stm.info/"
                    }
                  ],
                  "color": "#f27f2f",
                  "name": "Ligne Orange",
                  "short_name": "2",
                  "text_color": "#000000",
                  "vehicle": {
                    "icon": "//maps.gstatic.com/mapfiles/transit/iw2/6/subway2.png",
                    "name": "Subway",
                    "type": "SUBWAY"
                  }
                },
                "num_stops": 1
              },
              "travel_mode": "TRANSIT"
            },
            {
              "distance": {
                "text": "0.5 km",
                "value": 464
              },
              "duration": {
                "text": "8 mins",
                "value": 454
              },
              "end_location": {
                "lat": 45.5087012,
                "lng": -73.5537541
              },
              "html_instructions": "Walk to 275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
              "polyline": {
                "points": "muwtGhn}_MGn@Mf@TLRLBBB@THRJf@TRHLDjAwCp@eB?CKGQQAAAA?A@ABKDO@EFWBE@KLo@Jg@@Q?EDM@GBGJa@Ty@Pq@aAu@"
              },
              "start_location": {
                "lat": 45.5101481,
                "lng": -73.5563732
              },
              "steps": [
                {
                  "distance": {
                    "text": "19 m",
                    "value": 19
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 48
                  },
                  "end_location": {
                    "lat": 45.5101899,
                    "lng": -73.5566132
                  },
                  "html_instructions": "Take exit \u003Cspan class=\"location\"\u003EAv Viger\u003C/span\u003E",
                  "polyline": {
                    "points": "muwtGhn}_MGn@"
                  },
                  "start_location": {
                    "lat": 45.5101481,
                    "lng": -73.5563732
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "93 m",
                    "value": 93
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 73
                  },
                  "end_location": {
                    "lat": 45.5094289,
                    "lng": -73.5572757
                  },
                  "html_instructions": "Head \u003Cb\u003Esouthwest\u003C/b\u003E on \u003Cb\u003EAve Viger E\u003C/b\u003E toward \u003Cb\u003ERue Ste-Élisabeth\u003C/b\u003E",
                  "polyline": {
                    "points": "cvwtG`q}_MTLRLBBB@THRJf@TRHLD"
                  },
                  "start_location": {
                    "lat": 45.5102557,
                    "lng": -73.5568122
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.1 km",
                    "value": 128
                  },
                  "duration": {
                    "text": "2 mins",
                    "value": 107
                  },
                  "end_location": {
                    "lat": 45.5087972,
                    "lng": -73.5559918
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E toward \u003Cb\u003EAv. de l'Hôtel-de-Ville\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "}pwtG~s}_MjAwCp@eB?C"
                  },
                  "start_location": {
                    "lat": 45.5094289,
                    "lng": -73.5572757
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "27 m",
                    "value": 27
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 20
                  },
                  "end_location": {
                    "lat": 45.508915,
                    "lng": -73.5556838
                  },
                  "html_instructions": "Continue onto \u003Cb\u003EAv. de l'Hôtel-de-Ville\u003C/b\u003E",
                  "polyline": {
                    "points": "_mwtG|k}_MKGQQAAAA?A@ABKDO"
                  },
                  "start_location": {
                    "lat": 45.5087972,
                    "lng": -73.5559918
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.2 km",
                    "value": 155
                  },
                  "duration": {
                    "text": "3 mins",
                    "value": 171
                  },
                  "end_location": {
                    "lat": 45.5083727,
                    "lng": -73.5540229
                  },
                  "html_instructions": "Slight \u003Cb\u003Eright\u003C/b\u003E toward \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003ETake the stairs\u003C/div\u003E",
                  "maneuver": "turn-slight-right",
                  "polyline": {
                    "points": "umwtG~i}_M@EFWBE@KLo@Jg@@Q?EDM@GBGJa@Ty@Pq@"
                  },
                  "start_location": {
                    "lat": 45.508915,
                    "lng": -73.5556838
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "42 m",
                    "value": 42
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 35
                  },
                  "end_location": {
                    "lat": 45.5087012,
                    "lng": -73.5537541
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the left\u003C/div\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "ijwtGr_}_MaAu@"
                  },
                  "start_location": {
                    "lat": 45.5083727,
                    "lng": -73.5540229
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            }
          ],
          "traffic_speed_entry": [],
          "via_waypoint": []
        }
      ],
      "overview_polyline": {
        "points": "{tvtGroa`Mt@mBHGEQnC}GJULOCCdBiExAyDWIq@s@YU?BoCuCBK_YuRqPcUWUoXgVBCf_@{ZSk@Gn@Mf@TLVPtAl@`@N|B}FKKSSACLc@ZyARmAf@kBPq@aAu@"
      },
      "summary": "",
      "warnings": [
        "Walking directions are in beta. Use caution – This route may be missing sidewalks or pedestrian paths."
      ],
      "waypoint_order": []
    },
    {
      "bounds": {
        "northeast": {
          "lat": 45.5102557,
          "lng": -73.5537541
        },
        "southwest": {
          "lat": 45.4983315,
          "lng": -73.5770613
        }
      },
      "copyrights": "Powered by Google, ©2026 Google",
      "legs": [
        {
          "arrival_time": {
            "text": "7:04 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771632275
          },
          "departure_time": {
            "text": "6:38 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771630697
          },
          "distance": {
            "text": "3.2 km",
            "value": 3198
          },
          "duration": {
            "text": "26 mins",
            "value": 1578
          },
          "end_address": "275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
          "end_location": {
            "lat": 45.5087012,
            "lng": -73.5537541
          },
          "start_address": "859 Rue Sherbrooke O, Montréal, QC H3A 2K6, Canada",
          "start_location": {
            "lat": 45.5049357,
            "lng": -73.5770613
          },
          "steps": [
            {
              "distance": {
                "text": "0.4 km",
                "value": 446
              },
              "duration": {
                "text": "6 mins",
                "value": 365
              },
              "end_location": {
                "lat": 45.502651,
                "lng": -73.572418
              },
              "html_instructions": "Walk to Station McGill",
              "polyline": {
                "points": "{tvtGroa`M@?Ne@Ri@N]HGEQz@wBrAeDHO@ELOCCNc@tAeDHWnAaD@G`@aAEEJB"
              },
              "start_location": {
                "lat": 45.5049357,
                "lng": -73.5770613
              },
              "steps": [
                {
                  "distance": {
                    "text": "0.2 km",
                    "value": 227
                  },
                  "duration": {
                    "text": "3 mins",
                    "value": 171
                  },
                  "end_location": {
                    "lat": 45.5038203,
                    "lng": -73.5747367
                  },
                  "html_instructions": "Head \u003Cb\u003Esoutheast\u003C/b\u003E toward \u003Cb\u003ERte 138 E\u003C/b\u003E",
                  "polyline": {
                    "points": "{tvtGroa`M@?Ne@Ri@N]HGEQz@wBrAeDHO@ELOCC"
                  },
                  "start_location": {
                    "lat": 45.5049357,
                    "lng": -73.5770613
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.2 km",
                    "value": 213
                  },
                  "duration": {
                    "text": "3 mins",
                    "value": 187
                  },
                  "end_location": {
                    "lat": 45.5026837,
                    "lng": -73.572427
                  },
                  "html_instructions": "Continue onto \u003Cb\u003EAv. McGill College\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the left\u003C/div\u003E",
                  "polyline": {
                    "points": "{mvtGbaa`MNc@tAeDHWnAaD@G`@aA"
                  },
                  "start_location": {
                    "lat": 45.5038203,
                    "lng": -73.5747367
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "6 m",
                    "value": 6
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 7
                  },
                  "end_location": {
                    "lat": 45.502651,
                    "lng": -73.572418
                  },
                  "html_instructions": "Take entrance \u003Cspan class=\"location\"\u003EEntrée Centre Eaton\u003C/span\u003E",
                  "polyline": {
                    "points": "}fvtGnr``MJB"
                  },
                  "start_location": {
                    "lat": 45.502708,
                    "lng": -73.572403
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "0.5 km",
                "value": 547
              },
              "duration": {
                "text": "1 min",
                "value": 79
              },
              "end_location": {
                "lat": 45.499905,
                "lng": -73.567017
              },
              "html_instructions": "Light rail towards A1 - Brossard",
              "polyline": {
                "points": "qfvtGrr``MVTh@wAnDqJd@sApBcGRi@|A{ETu@RN"
              },
              "start_location": {
                "lat": 45.502651,
                "lng": -73.572418
              },
              "transit_details": {
                "arrival_stop": {
                  "location": {
                    "lat": 45.499905,
                    "lng": -73.567017
                  },
                  "name": "Gare Centrale"
                },
                "arrival_time": {
                  "text": "6:45 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771631141
                },
                "departure_stop": {
                  "location": {
                    "lat": 45.502651,
                    "lng": -73.572418
                  },
                  "name": "Station McGill"
                },
                "departure_time": {
                  "text": "6:44 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771631062
                },
                "headsign": "A1 - Brossard",
                "line": {
                  "agencies": [
                    {
                      "name": "Réseau Express Métropolitain",
                      "phone": "1 (833) 736-4636",
                      "url": "https://rem.info/"
                    }
                  ],
                  "color": "#73a400",
                  "name": "A4 - Deux-Montagnes / A1 - Brossard",
                  "short_name": "A4-A1",
                  "text_color": "#ffffff",
                  "vehicle": {
                    "icon": "//maps.gstatic.com/mapfiles/transit/iw2/6/tram2.png",
                    "name": "Light rail",
                    "type": "TRAM"
                  }
                },
                "num_stops": 1
              },
              "travel_mode": "TRANSIT"
            },
            {
              "distance": {
                "text": "0.2 km",
                "value": 202
              },
              "duration": {
                "text": "5 mins",
                "value": 283
              },
              "end_location": {
                "lat": 45.4983315,
                "lng": -73.5669176
              },
              "html_instructions": "Walk to Bonaventure",
              "polyline": {
                "points": "kuutGzp_`MrA_BFSl@b@Lc@LHTBRNdAt@LYEFZ\\"
              },
              "start_location": {
                "lat": 45.499905,
                "lng": -73.567017
              },
              "steps": [
                {
                  "distance": {
                    "text": "59 m",
                    "value": 59
                  },
                  "duration": {
                    "text": "2 mins",
                    "value": 92
                  },
                  "end_location": {
                    "lat": 45.4994825,
                    "lng": -73.5665407
                  },
                  "html_instructions": "Take exit \u003Cspan class=\"location\"\u003EGare Centrale\u003C/span\u003E",
                  "polyline": {
                    "points": "kuutGzp_`MrA_B"
                  },
                  "start_location": {
                    "lat": 45.499905,
                    "lng": -73.567017
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "39 m",
                    "value": 39
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 34
                  },
                  "end_location": {
                    "lat": 45.4990718,
                    "lng": -73.5664866
                  },
                  "html_instructions": "Head \u003Cb\u003Esouthwest\u003C/b\u003E on \u003Cb\u003ERue De la Gauchetière O\u003C/b\u003E/\u003Cwbr/\u003E\u003Cb\u003ER. de La Gauchetière\u003C/b\u003E",
                  "polyline": {
                    "points": "orutGfm_`Ml@b@Lc@LH"
                  },
                  "start_location": {
                    "lat": 45.4994418,
                    "lng": -73.5664361
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "68 m",
                    "value": 68
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 66
                  },
                  "end_location": {
                    "lat": 45.4985063,
                    "lng": -73.5668586
                  },
                  "html_instructions": "Slight \u003Cb\u003Eleft\u003C/b\u003E to stay on \u003Cb\u003ERue De la Gauchetière O\u003C/b\u003E/\u003Cwbr/\u003E\u003Cb\u003ER. de La Gauchetière\u003C/b\u003E",
                  "maneuver": "turn-slight-left",
                  "polyline": {
                    "points": "eputGpm_`MTBRNdAt@"
                  },
                  "start_location": {
                    "lat": 45.4990718,
                    "lng": -73.5664866
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "17 m",
                    "value": 17
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 14
                  },
                  "end_location": {
                    "lat": 45.4984385,
                    "lng": -73.5667311
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "ulutGzo_`MLY"
                  },
                  "start_location": {
                    "lat": 45.4985063,
                    "lng": -73.5668586
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "building_level": {
                    "number": 0
                  },
                  "distance": {
                    "text": "1 m",
                    "value": 0
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 0
                  },
                  "end_location": {
                    "lat": 45.4984385,
                    "lng": -73.5667311
                  },
                  "html_instructions": "Walk for 0 km",
                  "polyline": {
                    "points": "glutG`o_`M"
                  },
                  "start_location": {
                    "lat": 45.4984385,
                    "lng": -73.5667311
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "19 m",
                    "value": 19
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 77
                  },
                  "end_location": {
                    "lat": 45.4983315,
                    "lng": -73.5669176
                  },
                  "html_instructions": "Take entrance \u003Cspan class=\"location\"\u003ELe 1000 de la Gauchetière\u003C/span\u003E",
                  "polyline": {
                    "points": "mlutGho_`MZ\\"
                  },
                  "start_location": {
                    "lat": 45.4984718,
                    "lng": -73.566773
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "1.5 km",
                "value": 1525
              },
              "duration": {
                "text": "3 mins",
                "value": 180
              },
              "end_location": {
                "lat": 45.5098899,
                "lng": -73.556639
              },
              "html_instructions": "Subway towards Station Montmorency",
              "polyline": {
                "points": "qkutGfp_`MCDmU}V?AcXgSmA_AgUyPBK"
              },
              "start_location": {
                "lat": 45.4983315,
                "lng": -73.5669176
              },
              "transit_details": {
                "arrival_stop": {
                  "location": {
                    "lat": 45.5098899,
                    "lng": -73.556639
                  },
                  "name": "Champ-de-Mars"
                },
                "arrival_time": {
                  "text": "6:57 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771631820
                },
                "departure_stop": {
                  "location": {
                    "lat": 45.4983315,
                    "lng": -73.5669176
                  },
                  "name": "Bonaventure"
                },
                "departure_time": {
                  "text": "6:54 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771631640
                },
                "headsign": "Station Montmorency",
                "line": {
                  "agencies": [
                    {
                      "name": "Société de transport de Montréal",
                      "phone": "1 (514) 786-4636",
                      "url": "https://www.stm.info/"
                    }
                  ],
                  "color": "#f27f2f",
                  "name": "Ligne Orange",
                  "short_name": "2",
                  "text_color": "#000000",
                  "vehicle": {
                    "icon": "//maps.gstatic.com/mapfiles/transit/iw2/6/subway2.png",
                    "name": "Subway",
                    "type": "SUBWAY"
                  }
                },
                "num_stops": 3
              },
              "travel_mode": "TRANSIT"
            },
            {
              "distance": {
                "text": "0.5 km",
                "value": 478
              },
              "duration": {
                "text": "8 mins",
                "value": 455
              },
              "end_location": {
                "lat": 45.5087012,
                "lng": -73.5537541
              },
              "html_instructions": "Walk to 275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
              "polyline": {
                "points": "yswtG~o}_M{@EMf@TLRLBBB@THRJf@TRHLDjAwCp@eB?CKGQQAAAA?A@ABKDO@EFWBE@KLo@Jg@@Q?EDM@GBGJa@Ty@Pq@aAu@"
              },
              "start_location": {
                "lat": 45.5098899,
                "lng": -73.556639
              },
              "steps": [
                {
                  "distance": {
                    "text": "33 m",
                    "value": 33
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 49
                  },
                  "end_location": {
                    "lat": 45.5101899,
                    "lng": -73.5566132
                  },
                  "html_instructions": "Take exit \u003Cspan class=\"location\"\u003EAv Viger\u003C/span\u003E",
                  "polyline": {
                    "points": "yswtG~o}_M{@E"
                  },
                  "start_location": {
                    "lat": 45.5098899,
                    "lng": -73.556639
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "93 m",
                    "value": 93
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 73
                  },
                  "end_location": {
                    "lat": 45.5094289,
                    "lng": -73.5572757
                  },
                  "html_instructions": "Head \u003Cb\u003Esouthwest\u003C/b\u003E on \u003Cb\u003EAve Viger E\u003C/b\u003E toward \u003Cb\u003ERue Ste-Élisabeth\u003C/b\u003E",
                  "polyline": {
                    "points": "cvwtG`q}_MTLRLBBB@THRJf@TRHLD"
                  },
                  "start_location": {
                    "lat": 45.5102557,
                    "lng": -73.5568122
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.1 km",
                    "value": 128
                  },
                  "duration": {
                    "text": "2 mins",
                    "value": 107
                  },
                  "end_location": {
                    "lat": 45.5087972,
                    "lng": -73.5559918
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E toward \u003Cb\u003EAv. de l'Hôtel-de-Ville\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "}pwtG~s}_MjAwCp@eB?C"
                  },
                  "start_location": {
                    "lat": 45.5094289,
                    "lng": -73.5572757
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "27 m",
                    "value": 27
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 20
                  },
                  "end_location": {
                    "lat": 45.508915,
                    "lng": -73.5556838
                  },
                  "html_instructions": "Continue onto \u003Cb\u003EAv. de l'Hôtel-de-Ville\u003C/b\u003E",
                  "polyline": {
                    "points": "_mwtG|k}_MKGQQAAAA?A@ABKDO"
                  },
                  "start_location": {
                    "lat": 45.5087972,
                    "lng": -73.5559918
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.2 km",
                    "value": 155
                  },
                  "duration": {
                    "text": "3 mins",
                    "value": 171
                  },
                  "end_location": {
                    "lat": 45.5083727,
                    "lng": -73.5540229
                  },
                  "html_instructions": "Slight \u003Cb\u003Eright\u003C/b\u003E toward \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003ETake the stairs\u003C/div\u003E",
                  "maneuver": "turn-slight-right",
                  "polyline": {
                    "points": "umwtG~i}_M@EFWBE@KLo@Jg@@Q?EDM@GBGJa@Ty@Pq@"
                  },
                  "start_location": {
                    "lat": 45.508915,
                    "lng": -73.5556838
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "42 m",
                    "value": 42
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 35
                  },
                  "end_location": {
                    "lat": 45.5087012,
                    "lng": -73.5537541
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the left\u003C/div\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "ijwtGr_}_MaAu@"
                  },
                  "start_location": {
                    "lat": 45.5083727,
                    "lng": -73.5540229
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            }
          ],
          "traffic_speed_entry": [],
          "via_waypoint": []
        }
      ],
      "overview_polyline": {
        "points": "{tvtGroa`Mt@mBHGEQnC}GJULOCCdBiExAyDb@iAEEJBVTh@wAtEeMxF_QRNrA_BFSl@b@Lc@LHTBRNdAt@LYEFZ\\CDmU}VcXiSuWyRBK{@EMf@TLVPtAl@`@N|B}FKKSSACLc@ZyARmAf@kBPq@aAu@"
      },
      "summary": "",
      "warnings": [
        "Walking directions are in beta. Use caution – This route may be missing sidewalks or pedestrian paths."
      ],
      "waypoint_order": []
    },
    {
      "bounds": {
        "northeast": {
          "lat": 45.5219689,
          "lng": -73.5524547
        },
        "southwest": {
          "lat": 45.503519,
          "lng": -73.5770613
        }
      },
      "copyrights": "Powered by Google, ©2026 Google",
      "legs": [
        {
          "arrival_time": {
            "text": "7:20 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771633223
          },
          "departure_time": {
            "text": "6:45 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771631139
          },
          "distance": {
            "text": "4.9 km",
            "value": 4948
          },
          "duration": {
            "text": "35 mins",
            "value": 2084
          },
          "end_address": "275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
          "end_location": {
            "lat": 45.5087012,
            "lng": -73.5537541
          },
          "start_address": "859 Rue Sherbrooke O, Montréal, QC H3A 2K6, Canada",
          "start_location": {
            "lat": 45.5049357,
            "lng": -73.5770613
          },
          "steps": [
            {
              "distance": {
                "text": "0.3 km",
                "value": 255
              },
              "duration": {
                "text": "4 mins",
                "value": 214
              },
              "end_location": {
                "lat": 45.5035495,
                "lng": -73.5747432
              },
              "html_instructions": "Walk to Université McGill",
              "polyline": {
                "points": "{tvtGroa`M@?Ne@Ri@N]HGEQz@wBrAeDHO@ELOHHTRP_@?A"
              },
              "start_location": {
                "lat": 45.5049357,
                "lng": -73.5770613
              },
              "steps": [
                {
                  "distance": {
                    "text": "0.2 km",
                    "value": 227
                  },
                  "duration": {
                    "text": "3 mins",
                    "value": 171
                  },
                  "end_location": {
                    "lat": 45.5038036,
                    "lng": -73.5747563
                  },
                  "html_instructions": "Head \u003Cb\u003Esoutheast\u003C/b\u003E toward \u003Cb\u003ERte 138 E\u003C/b\u003E",
                  "polyline": {
                    "points": "{tvtGroa`M@?Ne@Ri@N]HGEQz@wBrAeDHO@ELO"
                  },
                  "start_location": {
                    "lat": 45.5049357,
                    "lng": -73.5770613
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "19 m",
                    "value": 19
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 16
                  },
                  "end_location": {
                    "lat": 45.5036352,
                    "lng": -73.5749145
                  },
                  "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E onto \u003Cb\u003ERte 138 O\u003C/b\u003E",
                  "maneuver": "turn-right",
                  "polyline": {
                    "points": "wmvtGfaa`MHHTR"
                  },
                  "start_location": {
                    "lat": 45.5038036,
                    "lng": -73.5747563
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "9 m",
                    "value": 9
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 27
                  },
                  "end_location": {
                    "lat": 45.5035495,
                    "lng": -73.5747432
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003EAv. McGill College\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the right\u003C/div\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "wlvtGdba`MP_@?A"
                  },
                  "start_location": {
                    "lat": 45.5036352,
                    "lng": -73.5749145
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "2.3 km",
                "value": 2314
              },
              "duration": {
                "text": "14 mins",
                "value": 859
              },
              "end_location": {
                "lat": 45.521721,
                "lng": -73.566678
              },
              "html_instructions": "Bus towards Est",
              "polyline": {
                "points": "_lvtGhaa`MIRGI[YqBqBIIeB}AWW{AuAIGKGe@UWM]OUKUOsAs@eAk@k@Y}Aw@eB}@]O_Ac@_A]SIOE[KQG]IEAa@Mi@Qi@Sk@QmBs@WKwDkAq@UUI[KmBq@aBm@uAa@yAi@_@OkBo@oAe@{@Yi@SyBu@OEi@SwDmA[Mc@OITGTENWx@EJQh@ABQf@y@~BCFSn@Un@I@iBkBYYuAkA{@y@uBkBkAgACCMKSQDM"
              },
              "start_location": {
                "lat": 45.503519,
                "lng": -73.574773
              },
              "transit_details": {
                "arrival_stop": {
                  "location": {
                    "lat": 45.521721,
                    "lng": -73.566678
                  },
                  "name": "Cherrier / Du Parc-La-Fontaine"
                },
                "arrival_time": {
                  "text": "7:04 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771632275
                },
                "departure_stop": {
                  "location": {
                    "lat": 45.503519,
                    "lng": -73.574773
                  },
                  "name": "Université McGill"
                },
                "departure_time": {
                  "text": "6:49 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771631353
                },
                "headsign": "Est",
                "line": {
                  "agencies": [
                    {
                      "name": "Société de transport de Montréal",
                      "phone": "1 (514) 786-4636",
                      "url": "https://www.stm.info/"
                    }
                  ],
                  "color": "#781b7d",
                  "name": "Sherbrooke",
                  "short_name": "24",
                  "text_color": "#ffffff",
                  "vehicle": {
                    "icon": "//maps.gstatic.com/mapfiles/transit/iw2/6/bus2.png",
                    "name": "Bus",
                    "type": "BUS"
                  }
                },
                "num_stops": 11
              },
              "travel_mode": "TRANSIT"
            },
            {
              "distance": {
                "text": "34 m",
                "value": 34
              },
              "duration": {
                "text": "1 min",
                "value": 30
              },
              "end_location": {
                "lat": 45.5219211,
                "lng": -73.5668519
              },
              "html_instructions": "Walk to Du Parc-La-Fontaine / Cherrier",
              "polyline": {
                "points": "u}ytGrn_`MMKUd@EJ"
              },
              "start_location": {
                "lat": 45.5217125,
                "lng": -73.5666593
              },
              "steps": [
                {
                  "distance": {
                    "text": "17 m",
                    "value": 17
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 13
                  },
                  "end_location": {
                    "lat": 45.5217777,
                    "lng": -73.5665994
                  },
                  "html_instructions": "Head \u003Cb\u003Enortheast\u003C/b\u003E on \u003Cb\u003ERue Cherrier\u003C/b\u003E toward \u003Cb\u003EAv. du Parc-La Fontaine\u003C/b\u003E",
                  "polyline": {
                    "points": "u}ytGrn_`MMK"
                  },
                  "start_location": {
                    "lat": 45.5217125,
                    "lng": -73.5666593
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "17 m",
                    "value": 17
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 17
                  },
                  "end_location": {
                    "lat": 45.5219211,
                    "lng": -73.5668519
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003EAv. du Parc-La Fontaine\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "c~ytGfn_`MUd@EJ"
                  },
                  "start_location": {
                    "lat": 45.5217777,
                    "lng": -73.5665994
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "2.2 km",
                "value": 2196
              },
              "duration": {
                "text": "8 mins",
                "value": 502
              },
              "end_location": {
                "lat": 45.509872,
                "lng": -73.552828
              },
              "html_instructions": "Bus towards Sud",
              "polyline": {
                "points": "a_ztGxo_`MGIPa@JYFMDKDIDKHOFOHS@GBQBGTs@JWHQ@CZ}@HS@CPe@JUHWh@uArAcEJY|BkGRi@p@kBHSpAuDf@wA`AqCJW|@iC|@cCJ]|@_CPi@dBaFL_@|ApAhB|ATRtAdAf@f@\\ZDFRRzApAZXn@h@VT\\\\@?ZXxArAJ]Tg@Vs@L_@b@wAHYN_@Ro@@?Pi@Tk@Ri@LWRo@Xu@f@{ARk@L]Rc@N_@HWHUd@kBRi@d@wAHYHUPNl@d@GT"
              },
              "start_location": {
                "lat": 45.521927,
                "lng": -73.566846
              },
              "transit_details": {
                "arrival_stop": {
                  "location": {
                    "lat": 45.509872,
                    "lng": -73.552828
                  },
                  "name": "Notre-Dame / De Bonsecours"
                },
                "arrival_time": {
                  "text": "7:18 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771633102
                },
                "departure_stop": {
                  "location": {
                    "lat": 45.521927,
                    "lng": -73.566846
                  },
                  "name": "Du Parc-La-Fontaine / Cherrier"
                },
                "departure_time": {
                  "text": "7:10 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771632600
                },
                "headsign": "Sud",
                "line": {
                  "agencies": [
                    {
                      "name": "Société de transport de Montréal",
                      "phone": "1 (514) 786-4636",
                      "url": "https://www.stm.info/"
                    }
                  ],
                  "color": "#009ee0",
                  "name": "Atateken",
                  "short_name": "14",
                  "text_color": "#ffffff",
                  "vehicle": {
                    "icon": "//maps.gstatic.com/mapfiles/transit/iw2/6/bus2.png",
                    "name": "Bus",
                    "type": "BUS"
                  }
                },
                "num_stops": 10
              },
              "travel_mode": "TRANSIT"
            },
            {
              "distance": {
                "text": "0.1 km",
                "value": 149
              },
              "duration": {
                "text": "2 mins",
                "value": 120
              },
              "end_location": {
                "lat": 45.5087012,
                "lng": -73.5537541
              },
              "html_instructions": "Walk to 275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
              "polyline": {
                "points": "uswtGbx|_MZV^ZXRFFn@h@PDJHZT`@X"
              },
              "start_location": {
                "lat": 45.5098676,
                "lng": -73.5528237
              },
              "steps": [
                {
                  "distance": {
                    "text": "0.1 km",
                    "value": 149
                  },
                  "duration": {
                    "text": "2 mins",
                    "value": 120
                  },
                  "end_location": {
                    "lat": 45.5087012,
                    "lng": -73.5537541
                  },
                  "html_instructions": "Head \u003Cb\u003Esouthwest\u003C/b\u003E on \u003Cb\u003ERue Notre Dame E\u003C/b\u003E toward \u003Cb\u003ERue Gosford\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the right\u003C/div\u003E",
                  "polyline": {
                    "points": "uswtGbx|_MZV^ZXRFFn@h@PDJHZT`@X"
                  },
                  "start_location": {
                    "lat": 45.5098676,
                    "lng": -73.5528237
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            }
          ],
          "traffic_speed_entry": [],
          "via_waypoint": []
        }
      ],
      "overview_polyline": {
        "points": "{tvtGroa`Mt@mBHGEQnC}GJULOHHTRP_@DBIRGImCkCcFuEsAs@}C_BqBeAcEuB}As@sAg@{Ac@{Bu@yCeAoEwAqE}AaBm@uAa@yBy@aHcCkJ}C_A]Qj@c@tAe@tAgBfFI@iBkBoBeBaGqFa@]FQMKUd@GJGIPa@Rg@Zq@Pc@DYn@eBh@yApAiD~A}EpCuHtDmKhEwL`EiLL_@|ApA~BpBtAdAf@f@b@b@zDhDrAlAxArAJ]l@{AjAqDf@yAv@mBhBmF`@aAXw@n@aCx@aCRo@~@t@GRz@r@`@Zn@h@PDf@^`@X"
      },
      "summary": "",
      "warnings": [
        "Walking directions are in beta. Use caution – This route may be missing sidewalks or pedestrian paths."
      ],
      "waypoint_order": []
    },
    {
      "bounds": {
        "northeast": {
          "lat": 45.509552,
          "lng": -73.5537541
        },
        "southwest": {
          "lat": 45.5032094,
          "lng": -73.5771037
        }
      },
      "copyrights": "Powered by Google, ©2026 Google",
      "legs": [
        {
          "arrival_time": {
            "text": "7:33 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771633993
          },
          "departure_time": {
            "text": "7:07 p.m.",
            "time_zone": "America/Toronto",
            "value": 1771632423
          },
          "distance": {
            "text": "2.9 km",
            "value": 2855
          },
          "duration": {
            "text": "26 mins",
            "value": 1570
          },
          "end_address": "275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
          "end_location": {
            "lat": 45.5087012,
            "lng": -73.5537541
          },
          "start_address": "859 Rue Sherbrooke O, Montréal, QC H3A 2K6, Canada",
          "start_location": {
            "lat": 45.504957,
            "lng": -73.5771037
          },
          "steps": [
            {
              "distance": {
                "text": "0.6 km",
                "value": 607
              },
              "duration": {
                "text": "8 mins",
                "value": 496
              },
              "end_location": {
                "lat": 45.5094755,
                "lng": -73.5738617
              },
              "html_instructions": "Walk to Du Parc / Milton",
              "polyline": {
                "points": "_uvtGzoa`MIICCEEa@a@GLCDCDGFI@I?GCYMCACAEAOCGCG?EAE?E?C@E@CFIIUUWUSQOMWUKKo@k@[YMKIKMMSQEECAACEE_@_@KK}@w@w@u@IK]YWUMOOMYUABCFEHKMGG_@a@CEGEGEg@g@GL"
              },
              "start_location": {
                "lat": 45.504957,
                "lng": -73.5771037
              },
              "steps": [
                {
                  "distance": {
                    "text": "37 m",
                    "value": 37
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 29
                  },
                  "end_location": {
                    "lat": 45.5052323,
                    "lng": -73.5768306
                  },
                  "html_instructions": "Head \u003Cb\u003Enortheast\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003ETake the stairs\u003C/div\u003E",
                  "polyline": {
                    "points": "_uvtGzoa`MIICCEEa@a@"
                  },
                  "start_location": {
                    "lat": 45.504957,
                    "lng": -73.5771037
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.1 km",
                    "value": 146
                  },
                  "duration": {
                    "text": "2 mins",
                    "value": 114
                  },
                  "end_location": {
                    "lat": 45.506468,
                    "lng": -73.5764715
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E toward \u003Cb\u003ERue Milton\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "uvvtGdna`MGLCDCDGFI@I?GCYMCACAEAOCGCG?EAE?E?C@E@CFIIUUWUSQOM"
                  },
                  "start_location": {
                    "lat": 45.5052323,
                    "lng": -73.5768306
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.3 km",
                    "value": 321
                  },
                  "duration": {
                    "text": "4 mins",
                    "value": 267
                  },
                  "end_location": {
                    "lat": 45.5088151,
                    "lng": -73.5742461
                  },
                  "html_instructions": "Continue onto \u003Cb\u003ERue Milton\u003C/b\u003E",
                  "polyline": {
                    "points": "m~vtG|ka`MWUKKo@k@[YMKIKMMSQEECAACEE_@_@KK}@w@w@u@IK]YWUMOOMYU"
                  },
                  "start_location": {
                    "lat": 45.506468,
                    "lng": -73.5764715
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "8 m",
                    "value": 8
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 7
                  },
                  "end_location": {
                    "lat": 45.5088751,
                    "lng": -73.5743605
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003ERue Hutchison\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "cmwtG`~``MABCFEH"
                  },
                  "start_location": {
                    "lat": 45.5088151,
                    "lng": -73.5742461
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "83 m",
                    "value": 83
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 70
                  },
                  "end_location": {
                    "lat": 45.5094431,
                    "lng": -73.5737935
                  },
                  "html_instructions": "Turn \u003Cb\u003Eright\u003C/b\u003E onto \u003Cb\u003ERue Milton\u003C/b\u003E",
                  "maneuver": "turn-right",
                  "polyline": {
                    "points": "omwtGv~``MKMGG_@a@CEGEGEg@g@"
                  },
                  "start_location": {
                    "lat": 45.5088751,
                    "lng": -73.5743605
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "12 m",
                    "value": 12
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 9
                  },
                  "end_location": {
                    "lat": 45.5094755,
                    "lng": -73.5738617
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003EAv. du Parc\u003C/b\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "_qwtGd{``MGL"
                  },
                  "start_location": {
                    "lat": 45.5094431,
                    "lng": -73.5737935
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            },
            {
              "distance": {
                "text": "2.0 km",
                "value": 2030
              },
              "duration": {
                "text": "9 mins",
                "value": 546
              },
              "end_location": {
                "lat": 45.509079,
                "lng": -73.555557
              },
              "html_instructions": "Bus towards Sud",
              "polyline": {
                "points": "gqwtGt{``MMMJYjAaDd@sAHQPk@p@iBDMXo@Vk@FQLYJYb@wADIHS~@{BVm@L_@HSJWNc@v@wBzAiEL_@Zy@Tk@Xu@DML[x@_CZy@HUL]Na@N[BIJWRm@d@oARe@|@eCHQLWL[d@iAJ[BKBIDORq@J[L]~@cCL_@{AmAaBqAcAw@a@_@o@g@aBoAcAw@e@]qAeA_@YmAgAc@W_@WWOYSCCg@[QKGEAA]Sk@_@s@k@YSEEa@Y[U_@WBM"
              },
              "start_location": {
                "lat": 45.509484,
                "lng": -73.573866
              },
              "transit_details": {
                "arrival_stop": {
                  "location": {
                    "lat": 45.509079,
                    "lng": -73.555557
                  },
                  "name": "Saint-Antoine / Gosford"
                },
                "arrival_time": {
                  "text": "7:29 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771633759
                },
                "departure_stop": {
                  "location": {
                    "lat": 45.509484,
                    "lng": -73.573866
                  },
                  "name": "Du Parc / Milton"
                },
                "departure_time": {
                  "text": "7:15 p.m.",
                  "time_zone": "America/Toronto",
                  "value": 1771632929
                },
                "headsign": "Sud",
                "line": {
                  "agencies": [
                    {
                      "name": "Société de transport de Montréal",
                      "phone": "1 (514) 786-4636",
                      "url": "https://www.stm.info/"
                    }
                  ],
                  "color": "#009ee0",
                  "name": "Côte-Sainte-Catherine",
                  "short_name": "129",
                  "text_color": "#ffffff",
                  "vehicle": {
                    "icon": "//maps.gstatic.com/mapfiles/transit/iw2/6/bus2.png",
                    "name": "Bus",
                    "type": "BUS"
                  }
                },
                "num_stops": 8
              },
              "travel_mode": "TRANSIT"
            },
            {
              "distance": {
                "text": "0.2 km",
                "value": 218
              },
              "duration": {
                "text": "4 mins",
                "value": 212
              },
              "end_location": {
                "lat": 45.5087012,
                "lng": -73.5537541
              },
              "html_instructions": "Walk to 275 Rue Notre Dame E local RC-150, Montréal, QC H2Y 4B7, Canada",
              "polyline": {
                "points": "wnwtGfi}_M`@V@EFWBE@KLo@Jg@@Q?EDM@GBGJa@Ty@Pq@aAu@"
              },
              "start_location": {
                "lat": 45.5090806,
                "lng": -73.5555616
              },
              "steps": [
                {
                  "distance": {
                    "text": "21 m",
                    "value": 21
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 16
                  },
                  "end_location": {
                    "lat": 45.508915,
                    "lng": -73.5556838
                  },
                  "html_instructions": "Head \u003Cb\u003Esouthwest\u003C/b\u003E on \u003Cb\u003ERue Saint-Antoine E\u003C/b\u003E toward \u003Cb\u003EAv. de l'Hôtel-de-Ville\u003C/b\u003E",
                  "polyline": {
                    "points": "wnwtGfi}_M`@V"
                  },
                  "start_location": {
                    "lat": 45.5090806,
                    "lng": -73.5555616
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "0.2 km",
                    "value": 155
                  },
                  "duration": {
                    "text": "3 mins",
                    "value": 161
                  },
                  "end_location": {
                    "lat": 45.5083727,
                    "lng": -73.5540229
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E toward \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003ETake the stairs\u003C/div\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "umwtG~i}_M@EFWBE@KLo@Jg@@Q?EDM@GBGJa@Ty@Pq@"
                  },
                  "start_location": {
                    "lat": 45.508915,
                    "lng": -73.5556838
                  },
                  "travel_mode": "WALKING"
                },
                {
                  "distance": {
                    "text": "42 m",
                    "value": 42
                  },
                  "duration": {
                    "text": "1 min",
                    "value": 35
                  },
                  "end_location": {
                    "lat": 45.5087012,
                    "lng": -73.5537541
                  },
                  "html_instructions": "Turn \u003Cb\u003Eleft\u003C/b\u003E onto \u003Cb\u003ERue Notre Dame E\u003C/b\u003E\u003Cdiv style=\"font-size:0.9em\"\u003EDestination will be on the left\u003C/div\u003E",
                  "maneuver": "turn-left",
                  "polyline": {
                    "points": "ijwtGr_}_MaAu@"
                  },
                  "start_location": {
                    "lat": 45.5083727,
                    "lng": -73.5540229
                  },
                  "travel_mode": "WALKING"
                }
              ],
              "travel_mode": "WALKING"
            }
          ],
          "traffic_speed_entry": [],
          "via_waypoint": []
        }
      ],
      "overview_polyline": {
        "points": "_uvtGzoa`MSSa@a@GLGJQHQC]Oa@KYAIBCFIIm@k@c@_@oBgBy@w@QQaDyCmAkAi@c@EJEHKMg@i@{@y@GNMMJYpBuFZ}@v@wBp@{AdA}CfBgEr@oB|D{KbAkC|CmIjCiHjAoCXaAlBoFL_@{AmAeDiCqAgAeDgCeFeEuBsAeAq@_@U_BkA}AiA_@WBM`@VNo@XwA@WV_Af@kBaAu@"
      },
      "summary": "",
      "warnings": [
        "Walking directions are in beta. Use caution – This route may be missing sidewalks or pedestrian paths."
      ],
      "waypoint_order": []
    }
  ], 
  driving: [], 
  bicycling: [], 
  shuttle: [],
  
};