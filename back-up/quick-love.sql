-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jan 23, 2018 at 01:12 PM
-- Server version: 5.7.20-0ubuntu0.16.04.1
-- PHP Version: 7.0.22-0ubuntu0.16.04.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `quick-love`
--

-- --------------------------------------------------------

--
-- Table structure for table `allowed_images_history`
--

CREATE TABLE `allowed_images_history` (
  `allowedImageID` bigint(20) NOT NULL,
  `allowedImageUserID` bigint(20) NOT NULL,
  `allowedImageModule` enum('DATING','JOBS') NOT NULL,
  `allowedImageCount` int(11) NOT NULL,
  `allowedImageDateTime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage allowed images while completing jobs & dates';

--
-- Dumping data for table `allowed_images_history`
--

INSERT INTO `allowed_images_history` (`allowedImageID`, `allowedImageUserID`, `allowedImageModule`, `allowedImageCount`, `allowedImageDateTime`) VALUES
(1, 67, 'DATING', 5, '2017-12-13 07:09:25'),
(2, 68, 'DATING', 5, '2017-12-13 07:09:25'),
(3, 67, 'DATING', 5, '2017-12-13 07:09:25'),
(4, 70, 'DATING', 5, '2017-12-13 07:09:25'),
(5, 67, 'DATING', 5, '2017-12-13 07:16:50'),
(6, 68, 'DATING', 5, '2017-12-13 07:16:50'),
(7, 67, 'DATING', 5, '2017-12-13 07:16:50'),
(8, 70, 'DATING', 5, '2017-12-13 07:16:50');

-- --------------------------------------------------------

--
-- Table structure for table `block_users`
--

CREATE TABLE `block_users` (
  `userBlockId` bigint(20) NOT NULL,
  `userBlockUserId` bigint(20) NOT NULL,
  `userBlockFriendId` bigint(20) NOT NULL,
  `userBlockDateTime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `call_history`
--

CREATE TABLE `call_history` (
  `callHistoryID` bigint(20) NOT NULL,
  `callHistoryModuleName` enum('FRIENDLY','DATING','PROVIDER') NOT NULL,
  `callSenderUserID` bigint(20) NOT NULL,
  `callRecieverUserID` bigint(20) NOT NULL,
  `userRoomName` varchar(100) DEFAULT NULL,
  `callInitiateTime` datetime NOT NULL,
  `callCompletedTime` datetime DEFAULT NULL,
  `callDuration` bigint(11) NOT NULL DEFAULT '0' COMMENT '(In Seconds)',
  `IsSenderCallReviewDone` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `IsRecieverCallReviewDone` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `senderCallReview` smallint(1) DEFAULT NULL,
  `recieverCallReview` smallint(1) DEFAULT NULL,
  `senderCallReviewMessage` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recieverCallReviewMessage` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `senderCallReviewDateTime` datetime DEFAULT NULL,
  `recieverCallReviewDateTime` datetime DEFAULT NULL,
  `callSenderStatus` varchar(150) NOT NULL,
  `callStatus` enum('INITIATED','MISSED_CALL','STARTED','DECLINE_CALL','FINISHED') NOT NULL DEFAULT 'INITIATED'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user call history';

-- --------------------------------------------------------

--
-- Table structure for table `call_history_users`
--

CREATE TABLE `call_history_users` (
  `callHistoryUsersID` bigint(20) NOT NULL,
  `callHistoryID` bigint(20) NOT NULL,
  `isCallOwner` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `callUserID` bigint(20) NOT NULL COMMENT '(Other users ids)',
  `callUserAddedDate` datetime NOT NULL,
  `callUserTerminatedDate` datetime DEFAULT NULL,
  `callUserTotalDuration` bigint(20) NOT NULL DEFAULT '0' COMMENT '(In Seconds)',
  `callUserStatus` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage call history users';

-- --------------------------------------------------------

--
-- Table structure for table `call_review`
--

CREATE TABLE `call_review` (
  `callReviewID` bigint(20) NOT NULL,
  `callReviewUserID` bigint(20) NOT NULL,
  `callReviewCallHistoryID` bigint(20) NOT NULL,
  `callReviewRating` smallint(1) NOT NULL DEFAULT '0',
  `callReviewMessage` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `callReviewDateTime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage call reviews';

-- --------------------------------------------------------

--
-- Table structure for table `contact_us`
--

CREATE TABLE `contact_us` (
  `contactId` bigint(20) NOT NULL,
  `contactUserId` bigint(20) NOT NULL,
  `contactPhone` varchar(150) NOT NULL,
  `contactMessage` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactDateTime` datetime NOT NULL,
  `isRepliedByAdmin` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `replyDateTime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `content`
--

CREATE TABLE `content` (
  `contentId` int(11) NOT NULL,
  `contentText` text NOT NULL,
  `contentType` varchar(50) NOT NULL,
  `contentAddedDate` datetime NOT NULL,
  `contentModifiedDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='For content pages like Terms & Conditions, Privacy Policy etc..';

--
-- Dumping data for table `content`
--

INSERT INTO `content` (`contentId`, `contentText`, `contentType`, `contentAddedDate`, `contentModifiedDate`) VALUES
(1, 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.', 'PRIVACY_POLICY', '2017-09-12 09:25:21', '2017-09-12 10:26:37'),
(2, '<p><u>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</u></p>', 'TERMS_CONDITIONS', '2017-09-12 09:25:21', '2017-12-26 07:09:18'),
(3, '<b><u><i>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</i></u></b>', 'ABOUT_US', '2017-09-12 08:20:20', '2017-12-26 07:09:02'),
(4, 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.', 'BECOME_PROVIDER', '2017-11-16 10:27:24', '2017-11-16 12:47:16'),
(5, 'Cancellation Policy If a cancellation for the upcoming work is made in a timeframe of 4 days or more prior to the job date, there will be No Cancelation Fee. If the cancelation of the upcoming work is made in a timeframe of 3 days or less prior to the job date, there will be a 25% cancelation fee. If the cancelation of the upcoming work is made in a timeframe of 1 day prior to the job date, there will be a 35% cancelation fee. Note-In all these cases, the App will still receive 10% of the total agreed payment from both sides. If this situation occurs, and an Instant Payment is done, the company will not be hold accountable if the worker does not want to give back those funds. We advise, in that situation, to set another date to carry on with the original agreed job.', 'CANCELLATION_POLICY', '2017-12-14 13:24:17', '2017-12-14 13:15:08');

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

CREATE TABLE `countries` (
  `countryId` int(11) NOT NULL,
  `countryCode` varchar(30) NOT NULL,
  `countryName` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` (`countryId`, `countryCode`, `countryName`) VALUES
(1, 'AF', 'Afghanistan'),
(2, 'AL', 'Albania'),
(3, 'DZ', 'Algeria'),
(4, 'AS', 'American Samoa'),
(5, 'AD', 'Andorra'),
(6, 'AO', 'Angola'),
(7, 'AI', 'Anguilla'),
(8, 'AQ', 'Antarctica'),
(9, 'AG', 'Antigua And Barbuda'),
(10, 'AR', 'Argentina'),
(11, 'AM', 'Armenia'),
(12, 'AW', 'Aruba'),
(13, 'AU', 'Australia'),
(14, 'AT', 'Austria'),
(15, 'AZ', 'Azerbaijan'),
(16, 'BS', 'Bahamas The'),
(17, 'BH', 'Bahrain'),
(18, 'BD', 'Bangladesh'),
(19, 'BB', 'Barbados'),
(20, 'BY', 'Belarus'),
(21, 'BE', 'Belgium'),
(22, 'BZ', 'Belize'),
(23, 'BJ', 'Benin'),
(24, 'BM', 'Bermuda'),
(25, 'BT', 'Bhutan'),
(26, 'BO', 'Bolivia'),
(27, 'BA', 'Bosnia and Herzegovina'),
(28, 'BW', 'Botswana'),
(29, 'BV', 'Bouvet Island'),
(30, 'BR', 'Brazil'),
(31, 'IO', 'British Indian Ocean Territory'),
(32, 'BN', 'Brunei'),
(33, 'BG', 'Bulgaria'),
(34, 'BF', 'Burkina Faso'),
(35, 'BI', 'Burundi'),
(36, 'KH', 'Cambodia'),
(37, 'CM', 'Cameroon'),
(38, 'CA', 'Canada'),
(39, 'CV', 'Cape Verde'),
(40, 'KY', 'Cayman Islands'),
(41, 'CF', 'Central African Republic'),
(42, 'TD', 'Chad'),
(43, 'CL', 'Chile'),
(44, 'CN', 'China'),
(45, 'CX', 'Christmas Island'),
(46, 'CC', 'Cocos (Keeling) Islands'),
(47, 'CO', 'Colombia'),
(48, 'KM', 'Comoros'),
(49, 'CG', 'Congo'),
(50, 'CD', 'Congo The Democratic Republic Of The'),
(51, 'CK', 'Cook Islands'),
(52, 'CR', 'Costa Rica'),
(53, 'CI', 'Cote D\'Ivoire (Ivory Coast)'),
(54, 'HR', 'Croatia (Hrvatska)'),
(55, 'CU', 'Cuba'),
(56, 'CY', 'Cyprus'),
(57, 'CZ', 'Czech Republic'),
(58, 'DK', 'Denmark'),
(59, 'DJ', 'Djibouti'),
(60, 'DM', 'Dominica'),
(61, 'DO', 'Dominican Republic'),
(62, 'TP', 'East Timor'),
(63, 'EC', 'Ecuador'),
(64, 'EG', 'Egypt'),
(65, 'SV', 'El Salvador'),
(66, 'GQ', 'Equatorial Guinea'),
(67, 'ER', 'Eritrea'),
(68, 'EE', 'Estonia'),
(69, 'ET', 'Ethiopia'),
(70, 'XA', 'External Territories of Australia'),
(71, 'FK', 'Falkland Islands'),
(72, 'FO', 'Faroe Islands'),
(73, 'FJ', 'Fiji Islands'),
(74, 'FI', 'Finland'),
(75, 'FR', 'France'),
(76, 'GF', 'French Guiana'),
(77, 'PF', 'French Polynesia'),
(78, 'TF', 'French Southern Territories'),
(79, 'GA', 'Gabon'),
(80, 'GM', 'Gambia The'),
(81, 'GE', 'Georgia'),
(82, 'DE', 'Germany'),
(83, 'GH', 'Ghana'),
(84, 'GI', 'Gibraltar'),
(85, 'GR', 'Greece'),
(86, 'GL', 'Greenland'),
(87, 'GD', 'Grenada'),
(88, 'GP', 'Guadeloupe'),
(89, 'GU', 'Guam'),
(90, 'GT', 'Guatemala'),
(91, 'XU', 'Guernsey and Alderney'),
(92, 'GN', 'Guinea'),
(93, 'GW', 'Guinea-Bissau'),
(94, 'GY', 'Guyana'),
(95, 'HT', 'Haiti'),
(96, 'HM', 'Heard and McDonald Islands'),
(97, 'HN', 'Honduras'),
(98, 'HK', 'Hong Kong S.A.R.'),
(99, 'HU', 'Hungary'),
(100, 'IS', 'Iceland'),
(101, 'IN', 'India'),
(102, 'ID', 'Indonesia'),
(103, 'IR', 'Iran'),
(104, 'IQ', 'Iraq'),
(105, 'IE', 'Ireland'),
(106, 'IL', 'Israel'),
(107, 'IT', 'Italy'),
(108, 'JM', 'Jamaica'),
(109, 'JP', 'Japan'),
(110, 'XJ', 'Jersey'),
(111, 'JO', 'Jordan'),
(112, 'KZ', 'Kazakhstan'),
(113, 'KE', 'Kenya'),
(114, 'KI', 'Kiribati'),
(115, 'KP', 'Korea North'),
(116, 'KR', 'Korea South'),
(117, 'KW', 'Kuwait'),
(118, 'KG', 'Kyrgyzstan'),
(119, 'LA', 'Laos'),
(120, 'LV', 'Latvia'),
(121, 'LB', 'Lebanon'),
(122, 'LS', 'Lesotho'),
(123, 'LR', 'Liberia'),
(124, 'LY', 'Libya'),
(125, 'LI', 'Liechtenstein'),
(126, 'LT', 'Lithuania'),
(127, 'LU', 'Luxembourg'),
(128, 'MO', 'Macau S.A.R.'),
(129, 'MK', 'Macedonia'),
(130, 'MG', 'Madagascar'),
(131, 'MW', 'Malawi'),
(132, 'MY', 'Malaysia'),
(133, 'MV', 'Maldives'),
(134, 'ML', 'Mali'),
(135, 'MT', 'Malta'),
(136, 'XM', 'Man (Isle of)'),
(137, 'MH', 'Marshall Islands'),
(138, 'MQ', 'Martinique'),
(139, 'MR', 'Mauritania'),
(140, 'MU', 'Mauritius'),
(141, 'YT', 'Mayotte'),
(142, 'MX', 'Mexico'),
(143, 'FM', 'Micronesia'),
(144, 'MD', 'Moldova'),
(145, 'MC', 'Monaco'),
(146, 'MN', 'Mongolia'),
(147, 'MS', 'Montserrat'),
(148, 'MA', 'Morocco'),
(149, 'MZ', 'Mozambique'),
(150, 'MM', 'Myanmar'),
(151, 'NA', 'Namibia'),
(152, 'NR', 'Nauru'),
(153, 'NP', 'Nepal'),
(154, 'AN', 'Netherlands Antilles'),
(155, 'NL', 'Netherlands The'),
(156, 'NC', 'New Caledonia'),
(157, 'NZ', 'New Zealand'),
(158, 'NI', 'Nicaragua'),
(159, 'NE', 'Niger'),
(160, 'NG', 'Nigeria'),
(161, 'NU', 'Niue'),
(162, 'NF', 'Norfolk Island'),
(163, 'MP', 'Northern Mariana Islands'),
(164, 'NO', 'Norway'),
(165, 'OM', 'Oman'),
(166, 'PK', 'Pakistan'),
(167, 'PW', 'Palau'),
(168, 'PS', 'Palestinian Territory Occupied'),
(169, 'PA', 'Panama'),
(170, 'PG', 'Papua new Guinea'),
(171, 'PY', 'Paraguay'),
(172, 'PE', 'Peru'),
(173, 'PH', 'Philippines'),
(174, 'PN', 'Pitcairn Island'),
(175, 'PL', 'Poland'),
(176, 'PT', 'Portugal'),
(177, 'PR', 'Puerto Rico'),
(178, 'QA', 'Qatar'),
(179, 'RE', 'Reunion'),
(180, 'RO', 'Romania'),
(181, 'RU', 'Russia'),
(182, 'RW', 'Rwanda'),
(183, 'SH', 'Saint Helena'),
(184, 'KN', 'Saint Kitts And Nevis'),
(185, 'LC', 'Saint Lucia'),
(186, 'PM', 'Saint Pierre and Miquelon'),
(187, 'VC', 'Saint Vincent And The Grenadines'),
(188, 'WS', 'Samoa'),
(189, 'SM', 'San Marino'),
(190, 'ST', 'Sao Tome and Principe'),
(191, 'SA', 'Saudi Arabia'),
(192, 'SN', 'Senegal'),
(193, 'RS', 'Serbia'),
(194, 'SC', 'Seychelles'),
(195, 'SL', 'Sierra Leone'),
(196, 'SG', 'Singapore'),
(197, 'SK', 'Slovakia'),
(198, 'SI', 'Slovenia'),
(199, 'XG', 'Smaller Territories of the UK'),
(200, 'SB', 'Solomon Islands'),
(201, 'SO', 'Somalia'),
(202, 'ZA', 'South Africa'),
(203, 'GS', 'South Georgia'),
(204, 'SS', 'South Sudan'),
(205, 'ES', 'Spain'),
(206, 'LK', 'Sri Lanka'),
(207, 'SD', 'Sudan'),
(208, 'SR', 'Suriname'),
(209, 'SJ', 'Svalbard And Jan Mayen Islands'),
(210, 'SZ', 'Swaziland'),
(211, 'SE', 'Sweden'),
(212, 'CH', 'Switzerland'),
(213, 'SY', 'Syria'),
(214, 'TW', 'Taiwan'),
(215, 'TJ', 'Tajikistan'),
(216, 'TZ', 'Tanzania'),
(217, 'TH', 'Thailand'),
(218, 'TG', 'Togo'),
(219, 'TK', 'Tokelau'),
(220, 'TO', 'Tonga'),
(221, 'TT', 'Trinidad And Tobago'),
(222, 'TN', 'Tunisia'),
(223, 'TR', 'Turkey'),
(224, 'TM', 'Turkmenistan'),
(225, 'TC', 'Turks And Caicos Islands'),
(226, 'TV', 'Tuvalu'),
(227, 'UG', 'Uganda'),
(228, 'UA', 'Ukraine'),
(229, 'AE', 'United Arab Emirates'),
(230, 'GB', 'United Kingdom'),
(231, 'US', 'United States'),
(232, 'UM', 'United States Minor Outlying Islands'),
(233, 'UY', 'Uruguay'),
(234, 'UZ', 'Uzbekistan'),
(235, 'VU', 'Vanuatu'),
(236, 'VA', 'Vatican City State (Holy See)'),
(237, 'VE', 'Venezuela'),
(238, 'VN', 'Vietnam'),
(239, 'VG', 'Virgin Islands (British)'),
(240, 'VI', 'Virgin Islands (US)'),
(241, 'WF', 'Wallis And Futuna Islands'),
(242, 'EH', 'Western Sahara'),
(243, 'YE', 'Yemen'),
(244, 'YU', 'Yugoslavia'),
(245, 'ZM', 'Zambia'),
(246, 'ZW', 'Zimbabwe');

-- --------------------------------------------------------

--
-- Table structure for table `dating_review`
--

CREATE TABLE `dating_review` (
  `datingReviewID` bigint(20) NOT NULL,
  `datingReviewUserID` bigint(20) NOT NULL,
  `datingReviewDateScheduleID` bigint(20) NOT NULL,
  `datingReviewRating` smallint(1) NOT NULL DEFAULT '0',
  `datingReviewMessage` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `datingReviewDateTime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage dating reviews';

--
-- Dumping data for table `dating_review`
--

INSERT INTO `dating_review` (`datingReviewID`, `datingReviewUserID`, `datingReviewDateScheduleID`, `datingReviewRating`, `datingReviewMessage`, `datingReviewDateTime`) VALUES
(4, 67, 1, 2, 'Awesome ', '2017-11-15 06:43:21');

-- --------------------------------------------------------

--
-- Table structure for table `deal_breaker_preferences`
--

CREATE TABLE `deal_breaker_preferences` (
  `dealBreakerPreferenceId` bigint(20) NOT NULL,
  `dealBreakerPreferenceUserId` bigint(20) NOT NULL,
  `dealBreakerPreferenceType` enum('FRIENDLY','DATING','PROVIDER') NOT NULL,
  `dealBreakerPreferenceText` varchar(250) NOT NULL,
  `dealBreakerPreferenceCreatedDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user deal breaker preferences';

--
-- Dumping data for table `deal_breaker_preferences`
--

INSERT INTO `deal_breaker_preferences` (`dealBreakerPreferenceId`, `dealBreakerPreferenceUserId`, `dealBreakerPreferenceType`, `dealBreakerPreferenceText`, `dealBreakerPreferenceCreatedDate`) VALUES
(21, 69, 'FRIENDLY', 'h1', '2017-10-04 13:20:56'),
(22, 69, 'FRIENDLY', 'h2', '2017-10-04 13:20:56'),
(23, 69, 'FRIENDLY', 'h3', '2017-10-04 13:20:56'),
(24, 68, 'PROVIDER', 'h1', '2017-11-20 08:42:47'),
(25, 68, 'PROVIDER', 'h2', '2017-11-20 08:42:47'),
(26, 68, 'PROVIDER', 'h3', '2017-11-20 08:42:47');

-- --------------------------------------------------------

--
-- Table structure for table `describe_preferences`
--

CREATE TABLE `describe_preferences` (
  `describePreferenceId` bigint(20) NOT NULL,
  `describePreferenceUserId` bigint(20) NOT NULL,
  `describePreferenceType` enum('FRIENDLY','DATING','PROVIDER') NOT NULL,
  `describePreferenceParentID` bigint(20) NOT NULL,
  `describePreferenceCreatedDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user describe preferences';

--
-- Dumping data for table `describe_preferences`
--

INSERT INTO `describe_preferences` (`describePreferenceId`, `describePreferenceUserId`, `describePreferenceType`, `describePreferenceParentID`, `describePreferenceCreatedDate`) VALUES
(11, 69, 'FRIENDLY', 3, '2017-10-04 13:20:56'),
(14, 68, 'PROVIDER', 1, '2017-11-20 08:42:47'),
(15, 68, 'PROVIDER', 2, '2017-11-20 08:42:47'),
(16, 68, 'PROVIDER', 3, '2017-11-20 08:42:47');

-- --------------------------------------------------------

--
-- Table structure for table `friends`
--

CREATE TABLE `friends` (
  `masterFriendId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL COMMENT '(Sender Id)',
  `friendId` bigint(20) NOT NULL COMMENT '(Reciever Id)',
  `friendStatus` enum('PENDING','ACCEPT','REJECT') NOT NULL DEFAULT 'PENDING',
  `friendRequestSentTime` datetime NOT NULL,
  `friendRequestResponseTime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user friends';

-- --------------------------------------------------------

--
-- Table structure for table `hold_amounts`
--

CREATE TABLE `hold_amounts` (
  `holdAmountID` bigint(20) NOT NULL,
  `holdAmountUserID` bigint(20) NOT NULL,
  `holdAmountJobID` bigint(20) NOT NULL,
  `holdAmount` float NOT NULL,
  `holdAmountStatus` enum('ON_HOLD','PAID','CANCELLED','OTHER') NOT NULL DEFAULT 'ON_HOLD',
  `holdAmountDateTime` datetime NOT NULL,
  `holdAmountResponseDateTime` datetime DEFAULT NULL,
  `holdAmountExtraParams` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user hold amount';

--
-- Dumping data for table `hold_amounts`
--

INSERT INTO `hold_amounts` (`holdAmountID`, `holdAmountUserID`, `holdAmountJobID`, `holdAmount`, `holdAmountStatus`, `holdAmountDateTime`, `holdAmountResponseDateTime`, `holdAmountExtraParams`) VALUES
(24, 67, 24, 15, 'ON_HOLD', '2018-01-23 04:44:05', NULL, NULL),
(25, 67, 25, 15, 'PAID', '2018-01-23 04:45:04', '2018-01-23 04:46:02', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `jobID` bigint(20) NOT NULL,
  `jobCustomID` varchar(150) DEFAULT NULL,
  `jobHirerUserID` bigint(20) NOT NULL COMMENT '(Sender)',
  `jobProviderUserID` bigint(20) NOT NULL COMMENT '(Receiver)',
  `jobTitle` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jobDescprition` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `jobMode` enum('ONLINE','LOCAL') NOT NULL,
  `jobAddress` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `jobLatitude` varchar(150) DEFAULT NULL,
  `jobLongitude` varchar(150) DEFAULT NULL,
  `jobStartDate` date DEFAULT NULL,
  `jobEndDate` date DEFAULT NULL,
  `jobPaymentMethod` enum('ADVANCE','FROZEN','ADVANCE_AND_FROZEN') NOT NULL,
  `jobAgreedAmount` float NOT NULL COMMENT '(In USD)',
  `jobAdvanceAmount` float DEFAULT NULL,
  `jobMilestoneAmountTotal` float DEFAULT NULL,
  `jobType` enum('FIXED','MILESTONES') NOT NULL,
  `jobNoOfMilestones` smallint(6) NOT NULL DEFAULT '0',
  `jobHireDateTime` datetime NOT NULL,
  `jobGlobalStatus` enum('PENDING','COMPLETED','CANCELED','DISPUTE','MUTUALLY_CANCELED') NOT NULL DEFAULT 'PENDING',
  `jobAcceptStatus` enum('PENDING','ACCEPT','REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT '(Provider Accept Status)',
  `jobReview` float DEFAULT NULL,
  `jobDisputed` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `jobDisputeStatus` enum('NONE','PENDING','ADMIN_REJECTED','ADMIN_COMPLETED','USER_COMPLETED') NOT NULL DEFAULT 'NONE',
  `jobAcceptDateTime` datetime DEFAULT NULL,
  `jobResponseDateTime` datetime DEFAULT NULL COMMENT '(After complete Or cancel job)'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user jobs';

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`jobID`, `jobCustomID`, `jobHirerUserID`, `jobProviderUserID`, `jobTitle`, `jobDescprition`, `jobMode`, `jobAddress`, `jobLatitude`, `jobLongitude`, `jobStartDate`, `jobEndDate`, `jobPaymentMethod`, `jobAgreedAmount`, `jobAdvanceAmount`, `jobMilestoneAmountTotal`, `jobType`, `jobNoOfMilestones`, `jobHireDateTime`, `jobGlobalStatus`, `jobAcceptStatus`, `jobReview`, `jobDisputed`, `jobDisputeStatus`, `jobAcceptDateTime`, `jobResponseDateTime`) VALUES
(24, 'JID-20180123044405', 67, 68, 'Need Backend Developer New', 'Hi', 'LOCAL', 'Tilak Nagar, Indore', '22.35', '75.36', '2018-01-24', '2018-01-26', 'FROZEN', 15, 0, 15, 'MILESTONES', 2, '2018-01-23 04:44:05', 'MUTUALLY_CANCELED', 'PENDING', NULL, 0, 'NONE', NULL, NULL),
(25, 'JID-20180123044504', 67, 68, 'Need Backend Developer New', 'Hi', 'LOCAL', 'Tilak Nagar, Indore', '22.35', '75.36', '2018-01-24', '2018-01-26', 'FROZEN', 15, 0, 15, 'MILESTONES', 2, '2018-01-23 04:45:04', 'PENDING', 'ACCEPT', NULL, 0, 'NONE', '2018-01-23 04:46:02', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `jobs_payment_distribution`
--

CREATE TABLE `jobs_payment_distribution` (
  `jobPaymentDistributionID` bigint(20) NOT NULL,
  `jobParentID` bigint(20) NOT NULL,
  `jobHirerQlFeesPercent` float NOT NULL,
  `jobProviderQlFeesPercent` float NOT NULL,
  `jobHirerQlFeesAmount` float NOT NULL COMMENT '(Hirer QL Fees Amount Deduction)',
  `jobProviderQlFeesAmount` float NOT NULL COMMENT '(Provider QL Fees Amount Deduction)',
  `jobHirerAdvanceAmount` float DEFAULT NULL,
  `jobProviderAdvanceAmount` float DEFAULT NULL,
  `jobHirerMilestoneAmount` float DEFAULT NULL,
  `jobProviderMilestoneAmount` float DEFAULT NULL,
  `jobTotalAgreedAmount` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage jobs payment distribution';

--
-- Dumping data for table `jobs_payment_distribution`
--

INSERT INTO `jobs_payment_distribution` (`jobPaymentDistributionID`, `jobParentID`, `jobHirerQlFeesPercent`, `jobProviderQlFeesPercent`, `jobHirerQlFeesAmount`, `jobProviderQlFeesAmount`, `jobHirerAdvanceAmount`, `jobProviderAdvanceAmount`, `jobHirerMilestoneAmount`, `jobProviderMilestoneAmount`, `jobTotalAgreedAmount`) VALUES
(24, 24, 10, 10, 1.5, 1.5, 0, 0, 15, NULL, 15),
(25, 25, 10, 10, 1.5, 1.5, 0, 0, 15, NULL, 15);

-- --------------------------------------------------------

--
-- Table structure for table `jobs_review`
--

CREATE TABLE `jobs_review` (
  `jobReviewID` bigint(20) NOT NULL,
  `jobReviewUserID` bigint(20) NOT NULL,
  `jobReviewParentID` bigint(20) NOT NULL,
  `jobReviewRating` float NOT NULL,
  `jobReviewMessage` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `jobReviewDateTime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage jobs review';

-- --------------------------------------------------------

--
-- Table structure for table `job_cancel`
--

CREATE TABLE `job_cancel` (
  `jobCancelID` bigint(20) NOT NULL,
  `jobCancelUserID` bigint(20) NOT NULL,
  `jobParentID` bigint(20) NOT NULL,
  `jobCancelStatus` enum('INITIATED','CANCELLED','COMPLETED','OTHER') NOT NULL DEFAULT 'INITIATED',
  `jobCancelReason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '(Initiator)',
  `jobCancelDatetime` datetime NOT NULL,
  `jobCancelResponseDatetime` datetime DEFAULT NULL COMMENT '(For Cancel OR Completed)',
  `jobCancelFeesPercent` float NOT NULL,
  `jobCancelFeesAmount` float NOT NULL,
  `jobPaidAmount` float DEFAULT NULL,
  `jobCancelRemainingAmount` float DEFAULT NULL COMMENT '(Hold amount on QL, still not paid)',
  `jobCancelAdminRefundAmount` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage cancel jobs';

--
-- Dumping data for table `job_cancel`
--

INSERT INTO `job_cancel` (`jobCancelID`, `jobCancelUserID`, `jobParentID`, `jobCancelStatus`, `jobCancelReason`, `jobCancelDatetime`, `jobCancelResponseDatetime`, `jobCancelFeesPercent`, `jobCancelFeesAmount`, `jobPaidAmount`, `jobCancelRemainingAmount`, `jobCancelAdminRefundAmount`) VALUES
(6, 67, 24, 'INITIATED', 'Not working', '2018-01-23 04:44:10', NULL, 0, 0, 0, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `job_disputes`
--

CREATE TABLE `job_disputes` (
  `jobDisputeID` bigint(20) NOT NULL,
  `jobDisputeUserID` bigint(20) NOT NULL,
  `jobParentID` bigint(20) NOT NULL,
  `jobDisputeStatus` enum('PENDING','ADMIN_REJECTED','ADMIN_COMPLETED','USER_COMPLETED') NOT NULL DEFAULT 'PENDING',
  `jobDisputeReason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `jobDisputeDateTime` datetime NOT NULL,
  `jobDisputeResponseDateTime` datetime DEFAULT NULL,
  `jobDisputePaidAmount` float DEFAULT NULL,
  `jobDisputeRemainingAmount` float DEFAULT NULL,
  `jobDisputeHireRefundAmount` float DEFAULT NULL,
  `jobDisputeProviderRefundAmount` float DEFAULT NULL,
  `jobDisputeExtraParams` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage all job disputes';

-- --------------------------------------------------------

--
-- Table structure for table `looking_preferences`
--

CREATE TABLE `looking_preferences` (
  `lookingPreferenceId` bigint(20) NOT NULL,
  `lookingPreferenceUserId` bigint(20) NOT NULL,
  `lookingPreferenceType` enum('FRIENDLY','DATING','PROVIDER') NOT NULL,
  `lookingPreferenceParentID` bigint(20) NOT NULL,
  `lookingPreferenceCreatedDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user looking preferences';

--
-- Dumping data for table `looking_preferences`
--

INSERT INTO `looking_preferences` (`lookingPreferenceId`, `lookingPreferenceUserId`, `lookingPreferenceType`, `lookingPreferenceParentID`, `lookingPreferenceCreatedDate`) VALUES
(5, 69, 'FRIENDLY', 10, '2017-10-04 13:20:56'),
(6, 69, 'FRIENDLY', 9, '2017-10-04 13:20:56'),
(7, 68, 'PROVIDER', 4, '2017-11-20 08:42:47'),
(8, 68, 'PROVIDER', 5, '2017-11-20 08:42:47');

-- --------------------------------------------------------

--
-- Table structure for table `milestones`
--

CREATE TABLE `milestones` (
  `milestoneID` bigint(20) NOT NULL,
  `milestoneJobID` bigint(20) NOT NULL,
  `milestoneTitle` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `milestoneAmount` float NOT NULL,
  `milestoneStatus` enum('PENDING','PAID') NOT NULL DEFAULT 'PENDING',
  `milestoneDateTime` datetime NOT NULL,
  `milestonePaidDateTime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user jobs milestones';

--
-- Dumping data for table `milestones`
--

INSERT INTO `milestones` (`milestoneID`, `milestoneJobID`, `milestoneTitle`, `milestoneAmount`, `milestoneStatus`, `milestoneDateTime`, `milestonePaidDateTime`) VALUES
(57, 24, 'Ist milestone', 5, 'PENDING', '2018-01-23 04:44:05', NULL),
(58, 24, '2nd milestone', 10, 'PENDING', '2018-01-23 04:44:05', NULL),
(59, 25, 'Ist milestone', 5, 'PENDING', '2018-01-23 04:45:04', NULL),
(60, 25, '2nd milestone', 10, 'PENDING', '2018-01-23 04:45:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notificationId` bigint(20) NOT NULL,
  `notificationUserId` bigint(20) NOT NULL COMMENT '(Sender ID)',
  `notificationFriendId` bigint(20) NOT NULL COMMENT '(Reciever ID)',
  `notificationType` varchar(150) NOT NULL,
  `callScheduleModuleID` bigint(20) DEFAULT NULL,
  `callHistoryModuleID` bigint(20) DEFAULT NULL,
  `dateScheduleModuleID` bigint(20) DEFAULT NULL,
  `friendModuleId` bigint(20) DEFAULT NULL,
  `jobModuleID` bigint(20) DEFAULT NULL,
  `orderModuleID` bigint(20) DEFAULT NULL,
  `reportModuleID` bigint(20) DEFAULT NULL,
  `txnModuleID` bigint(20) DEFAULT NULL,
  `notificationMessage` text NOT NULL,
  `notificationModule` enum('FRIENDLY','DATING','PROVIDER','GLOBAL') NOT NULL DEFAULT 'FRIENDLY',
  `notificationParams` text,
  `notificationSentTime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage freinds notifications';

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notificationId`, `notificationUserId`, `notificationFriendId`, `notificationType`, `callScheduleModuleID`, `callHistoryModuleID`, `dateScheduleModuleID`, `friendModuleId`, `jobModuleID`, `orderModuleID`, `reportModuleID`, `txnModuleID`, `notificationMessage`, `notificationModule`, `notificationParams`, `notificationSentTime`) VALUES
(35, 67, 70, 'SCHEDULE_DATE', NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, 'has scheduled a date with you', 'DATING', NULL, '2017-11-15 06:10:37'),
(36, 70, 67, 'ACCPET_SCHEDULED_DATE', NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, 'has accepted your dating request', 'DATING', NULL, '2017-11-15 06:10:41'),
(37, 67, 70, 'USER_DATE_REVIEW', NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, 'has gave a dating review', 'DATING', NULL, '2017-11-15 06:43:21'),
(82, 67, 68, 'PURCHASE_PRODUCT', NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 'has purchased a product', 'PROVIDER', NULL, '2017-12-05 05:31:50'),
(90, 67, 68, 'PURCHASE_PRODUCT', NULL, NULL, NULL, NULL, NULL, 4, NULL, NULL, 'has purchased a product', 'PROVIDER', NULL, '2017-12-06 07:43:51'),
(104, 67, 68, 'PURCHASE_PRODUCT', NULL, NULL, NULL, NULL, NULL, 5, NULL, NULL, 'has purchased a product', 'PROVIDER', NULL, '2017-12-06 11:28:00'),
(105, 67, 68, 'PURCHASE_PRODUCT', NULL, NULL, NULL, NULL, NULL, 6, NULL, NULL, 'has purchased a product', 'PROVIDER', NULL, '2017-12-06 12:05:51'),
(109, 67, 68, 'SCHEDULE_DATE', NULL, NULL, 2, NULL, NULL, NULL, NULL, NULL, 'has scheduled a date with you', 'DATING', NULL, '2017-12-13 06:15:19'),
(110, 67, 67, 'COMPLETED_5_DATES', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Congratulation !! you had successfully completed 1 dates, now you can upload 5 more images', 'GLOBAL', '{"allowedImageCount":5,"allowedImageDateTime":"2017-12-13 07:09:25"}', '2017-12-13 07:09:25'),
(111, 68, 68, 'COMPLETED_5_DATES', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Congratulation !! you had successfully completed 1 dates, now you can upload 5 more images', 'GLOBAL', '{"allowedImageCount":5,"allowedImageDateTime":"2017-12-13 07:09:25"}', '2017-12-13 07:09:25'),
(112, 67, 67, 'COMPLETED_5_DATES', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Congratulation !! you had successfully completed 1 dates, now you can upload 5 more images', 'GLOBAL', '{"allowedImageCount":5,"allowedImageDateTime":"2017-12-13 07:09:25"}', '2017-12-13 07:09:25'),
(113, 70, 70, 'COMPLETED_5_DATES', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Congratulation !! you had successfully completed 1 dates, now you can upload 5 more images', 'GLOBAL', '{"allowedImageCount":5,"allowedImageDateTime":"2017-12-13 07:09:25"}', '2017-12-13 07:09:25'),
(114, 67, 67, 'COMPLETED_5_DATES', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Congratulation !! you had successfully completed 1 dates, now you can upload 5 more images', 'GLOBAL', '{"allowedImageCount":5,"allowedImageDateTime":"2017-12-13 07:16:50"}', '2017-12-13 07:16:50'),
(115, 68, 68, 'COMPLETED_5_DATES', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Congratulation !! you had successfully completed 1 dates, now you can upload 5 more images', 'GLOBAL', '{"allowedImageCount":5,"allowedImageDateTime":"2017-12-13 07:16:50"}', '2017-12-13 07:16:50'),
(116, 67, 67, 'COMPLETED_5_DATES', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Congratulation !! you had successfully completed 1 dates, now you can upload 5 more images', 'GLOBAL', '{"allowedImageCount":5,"allowedImageDateTime":"2017-12-13 07:16:50"}', '2017-12-13 07:16:50'),
(117, 70, 70, 'COMPLETED_5_DATES', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Congratulation !! you had successfully completed 1 dates, now you can upload 5 more images', 'GLOBAL', '{"allowedImageCount":5,"allowedImageDateTime":"2017-12-13 07:16:50"}', '2017-12-13 07:16:50'),
(119, 68, 70, 'REPORT_FLAG', NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 'This is your 2nd Red Flag. A 3rd Red Flag could cause an Account Suspension. QL Team will be reviewing your case', 'GLOBAL', NULL, '2017-12-21 09:01:41'),
(120, 68, 68, 'TXN_DISPUTE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17, 'Transaction ID TXN-20171206104433 dispute request sent successfully to the site owner', 'PROVIDER', '{"transactionCustomID":"TXN-20171206104433"}', '2017-12-22 06:51:04'),
(121, 68, 68, 'TXN_DISPUTE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17, 'Transaction ID TXN-20171206104433 dispute request sent successfully to the site owner', 'PROVIDER', '{"transactionCustomID":"TXN-20171206104433"}', '2017-12-22 06:52:05'),
(122, 68, 68, 'TXN_DISPUTE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17, 'Transaction ID TXN-20171206104433 dispute request sent successfully to the site owner', 'PROVIDER', '{"transactionCustomID":"TXN-20171206104433"}', '2017-12-22 06:52:31'),
(123, 68, 68, 'TXN_DISPUTE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17, 'Transaction ID TXN-20171206104433 dispute request sent successfully to the site owner', 'PROVIDER', '{"transactionCustomID":"TXN-20171206104433"}', '2017-12-22 06:52:58'),
(124, 68, 68, 'TXN_DISPUTE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 16, 'Transaction ID TXN-20171206104412 dispute request successfully sent to the site owner', 'PROVIDER', '{"transactionCustomID":"TXN-20171206104412"}', '2017-12-22 06:55:49'),
(125, 68, 68, 'TXN_DISPUTE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 16, 'Transaction ID TXN-20171206104412 dispute request successfully sent to the site owner', 'PROVIDER', '{"transactionCustomID":"TXN-20171206104412"}', '2017-12-22 07:08:45'),
(126, 68, 68, 'TXN_DISPUTE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17, 'Transaction ID TXN-20171206104433 dispute request successfully sent to the site owner', 'PROVIDER', '{"transactionCustomID":"TXN-20171206104433"}', '2017-12-22 07:08:50'),
(127, 5, 68, 'TXN_DISPUTE_REQUEST_REJECTED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17, 'Transaction ID TXN-20171206104433 dispute request rejected by Quick Love team', 'GLOBAL', '{"transactionCustomID":"TXN-20171206104433","adminReason":"Fake"}', '2017-12-23 06:50:16'),
(128, 5, 68, 'TXN_DISPUTE_REQUEST_REJECTED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17, 'Transaction ID TXN-20171206104433 dispute request rejected by Quick Love team', 'GLOBAL', '{"transactionCustomID":"TXN-20171206104433","adminReason":"Fake txn"}', '2017-12-23 06:51:17'),
(129, 5, 68, 'TXN_DISPUTE_REQUEST_REJECTED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17, 'Transaction ID TXN-20171206104433 dispute request rejected by Quick Love team', 'GLOBAL', '{"transactionCustomID":"TXN-20171206104433","adminReason":"Test transaction"}', '2017-12-23 06:52:11'),
(130, 5, 68, 'TXN_DISPUTE_REQUEST_REJECTED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17, 'Transaction ID TXN-20171206104433 dispute request rejected by Quick Love team', 'GLOBAL', '{"transactionCustomID":"TXN-20171206104433","adminReason":"Test txn"}', '2017-12-23 06:55:36'),
(131, 5, 68, 'TXN_DISPUTE_AMOUNT_REFUNDED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 17, '$50 amount refunded into your payment gateway account byQuick Love team', 'GLOBAL', '{"transactionCustomID":"TXN-20171206104433","adminReason":"Thanks....."}', '2017-12-23 07:00:19'),
(152, 67, 70, 'SCHEDULE_CALL', 44, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'has scheduled a call', 'DATING', NULL, '2018-01-17 06:42:17'),
(153, 67, 70, 'SCHEDULE_CALL', 45, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'has scheduled a call', 'DATING', NULL, '2018-01-17 06:42:34'),
(154, 70, 67, 'ACCPET_SCHEDULED_CALL', 44, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'has accepted your call request', 'DATING', NULL, '2018-01-17 06:42:53'),
(155, 70, 67, 'ACCPET_SCHEDULED_CALL', 45, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'has accepted your call request', 'DATING', NULL, '2018-01-17 06:42:57'),
(160, 67, 68, 'HIRE_PROVIDER', NULL, NULL, NULL, NULL, 24, NULL, NULL, NULL, 'wants to hire you', 'PROVIDER', NULL, '2018-01-23 04:44:05'),
(161, 67, 68, 'CANCEL_JOB', NULL, NULL, NULL, NULL, 24, NULL, NULL, NULL, 'has cancelled a job', 'PROVIDER', NULL, '2018-01-23 04:44:10'),
(162, 67, 68, 'HIRE_PROVIDER', NULL, NULL, NULL, NULL, 25, NULL, NULL, NULL, 'wants to hire you', 'PROVIDER', NULL, '2018-01-23 04:45:04'),
(163, 68, 67, 'ACCEPT_JOB', NULL, NULL, NULL, NULL, 25, NULL, NULL, NULL, 'has accepted a job', 'PROVIDER', NULL, '2018-01-23 04:46:02'),
(164, 67, 68, 'MUTUALLY_CANCEL_JOB', NULL, NULL, NULL, NULL, 25, NULL, NULL, NULL, 'would like to cancel the Job, are you agree to cancel the Job?', 'PROVIDER', NULL, '2018-01-23 04:47:24'),
(165, 68, 67, 'REJECT_CANCEL_JOB', NULL, NULL, NULL, NULL, 25, NULL, NULL, NULL, 'rejected cancel job request', 'PROVIDER', NULL, '2018-01-23 07:40:20');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `orderID` bigint(20) NOT NULL,
  `orderCustomID` varchar(150) NOT NULL,
  `orderUserID` bigint(20) NOT NULL COMMENT '(Buyer)',
  `orderProductOwnerUserID` bigint(20) NOT NULL COMMENT '(Seller)',
  `orderTotalAmount` float NOT NULL,
  `orderProviderAmount` float NOT NULL,
  `orderQLFeesAmount` float NOT NULL COMMENT '(8 % QL Fees)',
  `orderStatus` enum('PENDING','COMPLETED') NOT NULL DEFAULT 'PENDING',
  `orderFullName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderContactNo` varchar(150) DEFAULT NULL,
  `orderShippingAddress` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `orderLandmark` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderCity` varchar(100) DEFAULT NULL,
  `orderState` varchar(150) DEFAULT NULL,
  `orderCountry` varchar(150) DEFAULT NULL,
  `orderZipCode` varchar(100) DEFAULT NULL,
  `orderLatitude` varchar(150) DEFAULT NULL,
  `orderLongitude` varchar(150) DEFAULT NULL,
  `orderDateTime` datetime NOT NULL,
  `orderPaymentGatewayAmount` float DEFAULT NULL COMMENT '(From Stripe Payment Gateway)',
  `orderWalletAmount` float DEFAULT NULL COMMENT '(From Quick Love Wallet)',
  `orderPaymentDateTime` datetime DEFAULT NULL,
  `orderPaymentStatus` enum('PENDING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
  `orderPaymentTxnID` text,
  `orderPaymentResponse` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage product orders';

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`orderID`, `orderCustomID`, `orderUserID`, `orderProductOwnerUserID`, `orderTotalAmount`, `orderProviderAmount`, `orderQLFeesAmount`, `orderStatus`, `orderFullName`, `orderContactNo`, `orderShippingAddress`, `orderLandmark`, `orderCity`, `orderState`, `orderCountry`, `orderZipCode`, `orderLatitude`, `orderLongitude`, `orderDateTime`, `orderPaymentGatewayAmount`, `orderWalletAmount`, `orderPaymentDateTime`, `orderPaymentStatus`, `orderPaymentTxnID`, `orderPaymentResponse`) VALUES
(1, 'OID-20171205053126', 67, 68, 251, 230.92, 20.08, 'PENDING', 'Sorav Garg', '9074939905', 'Tilak Nagar, Near Jain Mandir', 'Main road', 'Indore', 'MP', 'India', '452018', NULL, NULL, '2017-12-05 05:31:26', 251, 0, '2017-12-05 05:31:50', 'COMPLETED', 'txn_1BVZ22A6D6xB5c5vtcGKYfcP', '{"id":"ch_1BVZ22A6D6xB5c5vSWMaQ6A5","object":"charge","amount":25100,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BVZ22A6D6xB5c5vtcGKYfcP","captured":true,"created":1512451910,"currency":"usd","customer":null,"description":"Sorav1 Garg has purchased a product","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BVZ22A6D6xB5c5vSWMaQ6A5/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BVZ22A6D6xB5c5vpV70BSmT","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"0zlsbXCyhbRpztpp","funding":"unknown","last4":"1111","metadata":{},"name":"SG","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}'),
(4, 'OID-20171206074324', 67, 68, 251, 230.92, 20.08, 'PENDING', 'Sorav Garg', '9074939905', 'Tilak Nagar, Near Jain Mandir', 'Main road', 'Indore', 'MP', 'India', '452018', NULL, NULL, '2017-12-06 07:43:24', 249, 2, '2017-12-06 07:43:51', 'COMPLETED', 'txn_1BVxZKDgxxdmmt8GiFyF1cmZ', '{"id":"ch_1BVxZKDgxxdmmt8G0cpcLIKw","object":"charge","amount":24900,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BVxZKDgxxdmmt8GiFyF1cmZ","captured":true,"created":1512546230,"currency":"usd","customer":null,"description":"Sorav1 Garg has purchased a product","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BVxZKDgxxdmmt8G0cpcLIKw/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BVxZKDgxxdmmt8GtctRPwnt","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"yVdGGhX8xIDUncxw","funding":"unknown","last4":"1111","metadata":{},"name":"SG","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}'),
(5, 'OID-20171206112656', 67, 68, 251, 230.92, 20.08, 'PENDING', 'Sorav Garg', '9074939905', 'Tilak Nagar, Near Jain Mandir', 'Main road', 'Indore', 'MP', 'India', '452018', '22.35', '75.36', '2017-12-06 11:26:56', 249, 2, '2017-12-06 11:28:00', 'COMPLETED', 'txn_1BW14GDgxxdmmt8GSrPIWoBz', '{"id":"ch_1BW14GDgxxdmmt8GfTHjbVi4","object":"charge","amount":24900,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BW14GDgxxdmmt8GSrPIWoBz","captured":true,"created":1512559680,"currency":"usd","customer":null,"description":"Sorav1 Garg has purchased a product","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BW14GDgxxdmmt8GfTHjbVi4/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BW14GDgxxdmmt8GsjAhk9mR","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"yVdGGhX8xIDUncxw","funding":"unknown","last4":"1111","metadata":{},"name":"SG","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}'),
(6, 'OID-20171206120438', 67, 68, 251, 230.92, 20.08, 'PENDING', 'Sorav Garg', '9074939905', 'Tilak Nagar, Near Jain Mandir', 'Main road', 'Indore', 'MP', 'India', '452018', '22.35', '75.36', '2017-12-06 12:04:38', 250, 1, '2017-12-06 12:05:51', 'COMPLETED', 'txn_1BW1etDgxxdmmt8G7VLWKlm0', '{"id":"ch_1BW1etDgxxdmmt8GkSJCy5c9","object":"charge","amount":25000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BW1etDgxxdmmt8G7VLWKlm0","captured":true,"created":1512561951,"currency":"usd","customer":null,"description":"Sorav1 Garg has purchased a product","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BW1etDgxxdmmt8GkSJCy5c9/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BW1etDgxxdmmt8G7RSXIisj","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"yVdGGhX8xIDUncxw","funding":"unknown","last4":"1111","metadata":{},"name":"SG","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}'),
(7, 'OID-20171218110549', 67, 68, 25, 23, 2, 'PENDING', 'Sorav Garg\'s', '9074939905', 'Tilak Nagar, Near Jain Mandir', 'Main road', 'Indore', 'MP', 'India', '452018', '22.35', '75.36', '2017-12-18 11:05:49', NULL, NULL, NULL, 'PENDING', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_products`
--

CREATE TABLE `order_products` (
  `orderParentID` bigint(20) NOT NULL,
  `orderProductID` bigint(20) NOT NULL,
  `orderProductUserID` bigint(20) NOT NULL COMMENT '(Product Owner ID)',
  `orderProductName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderProductPrice` float NOT NULL,
  `orderProductDescprition` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `orderProductOriginalImages` text,
  `orderProductThumbnailImages` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage order products';

--
-- Dumping data for table `order_products`
--

INSERT INTO `order_products` (`orderParentID`, `orderProductID`, `orderProductUserID`, `orderProductName`, `orderProductPrice`, `orderProductDescprition`, `orderProductOriginalImages`, `orderProductThumbnailImages`) VALUES
(1, 1, 68, 'Online 11', 251, 'Hi 22', '["uploads/products/product-1511331363084-2e1fd54b-b2e1-d38d-dee5-036a41b1135e.jpg","uploads/products/product-1511790686945-8c45c316-c2ed-cb96-7ae2-61315ae070c5.png","uploads/products/product-1511790686946-3964a580-0e31-807d-4146-59094dfbfd9d.png"]', '["uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png","uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png","uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png"]'),
(4, 4, 68, 'Online 11', 251, 'Hi 22', '["uploads/products/product-1511331363084-2e1fd54b-b2e1-d38d-dee5-036a41b1135e.jpg","uploads/products/product-1511790686945-8c45c316-c2ed-cb96-7ae2-61315ae070c5.png","uploads/products/product-1511790686946-3964a580-0e31-807d-4146-59094dfbfd9d.png"]', '["uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png","uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png","uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png"]'),
(5, 5, 68, 'Online 11', 251, 'Hi 22', '["uploads/products/product-1511331363084-2e1fd54b-b2e1-d38d-dee5-036a41b1135e.jpg","uploads/products/product-1511790686945-8c45c316-c2ed-cb96-7ae2-61315ae070c5.png","uploads/products/product-1511790686946-3964a580-0e31-807d-4146-59094dfbfd9d.png"]', '["uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png","uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png","uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png"]'),
(6, 6, 68, 'Online 11', 251, 'Hi 22', '["uploads/products/product-1511331363084-2e1fd54b-b2e1-d38d-dee5-036a41b1135e.jpg","uploads/products/product-1511790686945-8c45c316-c2ed-cb96-7ae2-61315ae070c5.png","uploads/products/product-1511790686946-3964a580-0e31-807d-4146-59094dfbfd9d.png"]', '["uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png","uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png","uploads/products/product-1511790727183-d820b6f8-44a0-008c-303b-d6f19acfc47c-thumb.png"]'),
(7, 7, 68, 'Online', 25, 'Hi', '["uploads/products/product-1513328232646-6c0f2521-57d1-3340-95ad-f4a1f186f1e9.jpg","uploads/products/product-1513328232659-d20583cf-277d-3804-0834-0d46d206efb6.jpg","uploads/products/product-1513328232665-89081fe7-db28-e6ed-8630-ae4cb9958d89.jpg"]', '["uploads/products/product-1513328232646-6c0f2521-57d1-3340-95ad-f4a1f186f1e9-thumb.jpg","uploads/products/product-1513328232659-d20583cf-277d-3804-0834-0d46d206efb6-thumb.jpg","uploads/products/product-1513328232665-89081fe7-db28-e6ed-8630-ae4cb9958d89-thumb.jpg"]');

-- --------------------------------------------------------

--
-- Table structure for table `preferences`
--

CREATE TABLE `preferences` (
  `preferenceID` bigint(20) NOT NULL,
  `preferenceName` varchar(150) NOT NULL,
  `preferenceType` smallint(1) NOT NULL COMMENT '0 = Describe you, 1 = Looking you',
  `preferenceModuleType` enum('FRIENDLY','DATING','PROVIDER') NOT NULL,
  `preferenceCreatedDate` datetime NOT NULL,
  `preferenceModifyDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `preferences`
--

INSERT INTO `preferences` (`preferenceID`, `preferenceName`, `preferenceType`, `preferenceModuleType`, `preferenceCreatedDate`, `preferenceModifyDate`) VALUES
(1, 'Love', 0, 'FRIENDLY', '2017-09-27 09:23:20', '2017-09-27 09:23:20'),
(2, 'Nice', 0, 'FRIENDLY', '2017-09-27 09:23:20', '2017-09-27 09:23:20'),
(3, 'Happy', 0, 'FRIENDLY', '2017-09-27 09:23:20', '2017-09-27 09:23:20'),
(4, 'Cute', 0, 'FRIENDLY', '2017-09-27 09:23:20', '2017-09-27 09:23:20'),
(5, 'Serious', 0, 'FRIENDLY', '2017-09-27 09:23:20', '2017-09-27 09:23:20'),
(6, 'Willing', 1, 'FRIENDLY', '2017-09-27 09:23:20', '2017-09-27 09:23:20'),
(7, 'Recent', 1, 'FRIENDLY', '2017-09-27 09:23:20', '2017-09-27 09:23:20'),
(8, 'Helpful', 1, 'FRIENDLY', '2017-09-27 09:23:20', '2017-09-27 09:23:20'),
(9, 'Wonderful', 1, 'FRIENDLY', '2017-09-27 09:23:20', '2017-09-27 09:23:20'),
(10, 'Impossible', 1, 'FRIENDLY', '2017-09-27 09:23:20', '2017-09-27 09:23:20');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `productID` bigint(20) NOT NULL,
  `productUserID` bigint(20) NOT NULL,
  `productName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `productPrice` float NOT NULL,
  `productDescprition` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `productAddedDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage provider products';

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`productID`, `productUserID`, `productName`, `productPrice`, `productDescprition`, `productAddedDate`) VALUES
(98, 68, 'Online', 25, 'Hi', '2017-12-15 08:57:12');

-- --------------------------------------------------------

--
-- Table structure for table `products_images`
--

CREATE TABLE `products_images` (
  `productImageID` bigint(20) NOT NULL,
  `productParentID` bigint(20) NOT NULL,
  `productOriginalImage` text NOT NULL,
  `productThumbnailImage` text COMMENT '(200 * 200) '
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage product images';

--
-- Dumping data for table `products_images`
--

INSERT INTO `products_images` (`productImageID`, `productParentID`, `productOriginalImage`, `productThumbnailImage`) VALUES
(288, 98, 'uploads/products/product-1513328232646-6c0f2521-57d1-3340-95ad-f4a1f186f1e9.jpg', 'uploads/products/product-1513328232646-6c0f2521-57d1-3340-95ad-f4a1f186f1e9-thumb.jpg'),
(289, 98, 'uploads/products/product-1513328232659-d20583cf-277d-3804-0834-0d46d206efb6.jpg', 'uploads/products/product-1513328232659-d20583cf-277d-3804-0834-0d46d206efb6-thumb.jpg'),
(290, 98, 'uploads/products/product-1513328232665-89081fe7-db28-e6ed-8630-ae4cb9958d89.jpg', 'uploads/products/product-1513328232665-89081fe7-db28-e6ed-8630-ae4cb9958d89-thumb.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `report_flag_categories`
--

CREATE TABLE `report_flag_categories` (
  `reportFlagCategoryID` bigint(20) NOT NULL,
  `reportFlagCategoryName` varchar(150) NOT NULL,
  `reportFlagCategoryAddedDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `report_flag_categories`
--

INSERT INTO `report_flag_categories` (`reportFlagCategoryID`, `reportFlagCategoryName`, `reportFlagCategoryAddedDate`) VALUES
(2, 'Abusing', '2017-10-06 10:43:27'),
(3, 'Fake', '2017-10-06 10:44:31');

-- --------------------------------------------------------

--
-- Table structure for table `report_users`
--

CREATE TABLE `report_users` (
  `userReportId` bigint(20) NOT NULL,
  `userReportUserId` bigint(20) NOT NULL,
  `userReportFriendId` bigint(20) NOT NULL,
  `userReportCategory` varchar(100) NOT NULL,
  `userReportDescprition` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userReportImage` text,
  `userReportImageThumbnail` text,
  `userReportVideo` text,
  `userReportVideoThumbnail` text,
  `userReportDateTime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `report_users`
--

INSERT INTO `report_users` (`userReportId`, `userReportUserId`, `userReportFriendId`, `userReportCategory`, `userReportDescprition`, `userReportImage`, `userReportImageThumbnail`, `userReportVideo`, `userReportVideoThumbnail`, `userReportDateTime`) VALUES
(1, 68, 70, 'Abusing', 'Fake profile', '', NULL, '', NULL, '2017-12-21 09:01:41');

-- --------------------------------------------------------

--
-- Table structure for table `reschedule_calls`
--

CREATE TABLE `reschedule_calls` (
  `callReScheduleID` bigint(20) NOT NULL,
  `callScheduleID` bigint(20) NOT NULL,
  `callReScheduleDate` date NOT NULL,
  `callReScheduleTime` varchar(50) NOT NULL,
  `callReScheduleRequestDateTime` datetime NOT NULL,
  `callReScheduleRequestUserID` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `reschedule_dating`
--

CREATE TABLE `reschedule_dating` (
  `datingReScheduleID` bigint(20) NOT NULL,
  `datingScheduleID` bigint(20) NOT NULL,
  `datingReScheduleDate` date NOT NULL,
  `datingReScheduleTime` varchar(50) NOT NULL,
  `datingReScheduleLocation` text NOT NULL,
  `datingReScheduleLocationLatitude` varchar(150) DEFAULT NULL,
  `datingReScheduleLongitude` varchar(150) DEFAULT NULL,
  `datingReScheduleAfterMath` varchar(150) NOT NULL,
  `datingReScheduleRequestDateTime` datetime NOT NULL,
  `datingReScheduleRequestUserID` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `schedule_calls`
--

CREATE TABLE `schedule_calls` (
  `callScheduleID` bigint(20) NOT NULL,
  `callScheduleModuleName` enum('FRIENDLY','DATING','PROVIDER') NOT NULL,
  `callScheduleUserID` bigint(20) NOT NULL COMMENT '(Sender ID)',
  `callScheduleFriendID` bigint(20) NOT NULL COMMENT '(Receiver ID)',
  `callScheduleDate` date NOT NULL,
  `callScheduleTime` varchar(50) NOT NULL COMMENT '(24 Hours Format)',
  `callScheduleTimeZone` varchar(50) DEFAULT NULL,
  `callScheduleUserStatus` enum('PENDING','ACCEPT','REJECT','CANCELLED') DEFAULT 'PENDING',
  `callScheduleFriendStatus` enum('PENDING','ACCEPT','REJECT','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `callGlobalStatus` enum('PENDING','ACCEPT','REJECT','AUTO_REJECT','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `callScheduleUserResponseDateTime` datetime DEFAULT NULL,
  `callScheduleFriendResponseDateTime` datetime DEFAULT NULL,
  `isScheduledCallMutuallyConfirmed` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `userCallRequestTime` datetime NOT NULL COMMENT '(For one to one, scheduled calls)',
  `isCallRescheduled` smallint(6) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `lastRescheduleCallRequestTime` datetime DEFAULT NULL,
  `isNotificationSent` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `isUserCallReviewDone` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `userCallReview` decimal(10,0) DEFAULT NULL COMMENT '(Review after call finish)'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user calls,scheduled calls, group calls';

--
-- Dumping data for table `schedule_calls`
--

INSERT INTO `schedule_calls` (`callScheduleID`, `callScheduleModuleName`, `callScheduleUserID`, `callScheduleFriendID`, `callScheduleDate`, `callScheduleTime`, `callScheduleTimeZone`, `callScheduleUserStatus`, `callScheduleFriendStatus`, `callGlobalStatus`, `callScheduleUserResponseDateTime`, `callScheduleFriendResponseDateTime`, `isScheduledCallMutuallyConfirmed`, `userCallRequestTime`, `isCallRescheduled`, `lastRescheduleCallRequestTime`, `isNotificationSent`, `isUserCallReviewDone`, `userCallReview`) VALUES
(44, 'DATING', 67, 70, '2018-02-10', '19:00', 'Europe/Berlin', 'ACCEPT', 'ACCEPT', 'ACCEPT', '2018-01-17 06:42:17', '2018-01-17 06:42:53', 1, '2018-01-17 06:42:17', 0, NULL, 0, 0, NULL),
(45, 'DATING', 67, 70, '2018-02-10', '20:00', 'Europe/Berlin', 'ACCEPT', 'ACCEPT', 'ACCEPT', '2018-01-17 06:42:34', '2018-01-17 06:42:57', 1, '2018-01-17 06:42:34', 0, NULL, 0, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `schedule_dating`
--

CREATE TABLE `schedule_dating` (
  `datingScheduleID` bigint(20) NOT NULL,
  `datingScheduleModuleName` enum('FRIENDLY','DATING','PROVIDER') NOT NULL,
  `datingScheduleUserID` bigint(20) NOT NULL COMMENT '(Sender ID)',
  `datingScheduleFriendID` bigint(20) NOT NULL COMMENT '(Receiver ID)',
  `datingLocation` text NOT NULL,
  `datingLocationLatitude` varchar(150) DEFAULT NULL,
  `datingLocationLongitude` varchar(150) DEFAULT NULL,
  `datingAfterMath` varchar(150) NOT NULL,
  `datingScheduleDate` date NOT NULL,
  `datingScheduleTime` varchar(50) NOT NULL COMMENT '(24 Hours Format)',
  `datingScheduleTimeZone` varchar(50) DEFAULT NULL,
  `datingScheduleUserStatus` enum('PENDING','ACCEPT','REJECT','CANCELLED') DEFAULT 'PENDING',
  `datingScheduleFriendStatus` enum('PENDING','ACCEPT','REJECT','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `datingGlobalStatus` enum('PENDING','ACCEPT','REJECT','AUTO_REJECT','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `datingScheduleUserResponseDateTime` datetime DEFAULT NULL,
  `datingScheduleFriendResponseDateTime` datetime DEFAULT NULL,
  `isScheduledDateMutuallyConfirmed` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `userDateRequestTime` datetime NOT NULL COMMENT '(For one to one, scheduled dates)',
  `isDateRescheduled` smallint(6) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `lastRescheduleDateRequestTime` datetime DEFAULT NULL,
  `isUserDateReviewDone` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `userDateReview` decimal(10,0) DEFAULT NULL COMMENT '(Review after call finish)',
  `IsSenderDatingReviewDone` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `IsRecieverDatingReviewDone` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `senderDatingReview` smallint(1) DEFAULT NULL,
  `recieverDatingReview` smallint(1) DEFAULT NULL,
  `senderDatingReviewMessage` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recieverDatingReviewMessage` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `senderDatingReviewDateTime` datetime DEFAULT NULL,
  `recieverDatingReviewDateTime` datetime DEFAULT NULL,
  `isNotificationSent` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user dates,scheduled dates';

--
-- Dumping data for table `schedule_dating`
--

INSERT INTO `schedule_dating` (`datingScheduleID`, `datingScheduleModuleName`, `datingScheduleUserID`, `datingScheduleFriendID`, `datingLocation`, `datingLocationLatitude`, `datingLocationLongitude`, `datingAfterMath`, `datingScheduleDate`, `datingScheduleTime`, `datingScheduleTimeZone`, `datingScheduleUserStatus`, `datingScheduleFriendStatus`, `datingGlobalStatus`, `datingScheduleUserResponseDateTime`, `datingScheduleFriendResponseDateTime`, `isScheduledDateMutuallyConfirmed`, `userDateRequestTime`, `isDateRescheduled`, `lastRescheduleDateRequestTime`, `isUserDateReviewDone`, `userDateReview`, `IsSenderDatingReviewDone`, `IsRecieverDatingReviewDone`, `senderDatingReview`, `recieverDatingReview`, `senderDatingReviewMessage`, `recieverDatingReviewMessage`, `senderDatingReviewDateTime`, `recieverDatingReviewDateTime`, `isNotificationSent`) VALUES
(1, 'DATING', 67, 70, 'Indore', '22.36', '75.34', 'Hi', '2017-11-20', '19:00', 'America/Los_Angeles', 'ACCEPT', 'ACCEPT', 'ACCEPT', '2017-11-15 06:10:37', '2017-11-15 06:10:41', 1, '2017-11-15 06:10:37', 0, NULL, 0, NULL, 1, 0, 2, NULL, NULL, NULL, '2017-11-15 06:43:21', NULL, 0),
(2, 'DATING', 67, 68, 'Indore', '22.36', '75.34', 'Hi', '2017-11-20', '19:00', 'America/Los_Angeles', 'ACCEPT', 'ACCEPT', 'ACCEPT', '2017-11-13 06:15:19', NULL, 0, '2017-12-13 06:15:19', 0, NULL, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `search_logs`
--

CREATE TABLE `search_logs` (
  `id` bigint(20) NOT NULL,
  `query` text NOT NULL,
  `totalResults` int(11) NOT NULL DEFAULT '0',
  `userId` bigint(20) NOT NULL,
  `datetime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `search_logs`
--

INSERT INTO `search_logs` (`id`, `query`, `totalResults`, `userId`, `datetime`) VALUES
(1, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `U`.`masterUserId` NOT IN (67)  AND `UD`.`isPreferencesAdded` = 1 ORDER BY `UD`.`userFirstName` ASC', 3, 67, '2017-12-14 14:49:59'),
(2, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `U`.`masterUserId` NOT IN (67)  AND `UD`.`isPreferencesAdded` = 1 AND `UD`.`userCountry` LIKE \'%India%\' AND `UD`.`userCity` LIKE \'%Indore%\' ORDER BY `UD`.`userFirstName` ASC', 0, 67, '2017-12-14 14:50:34'),
(3, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `U`.`masterUserId` NOT IN (67)  AND `UD`.`isPreferencesAdded` = 1 AND `UD`.`userCountry` LIKE \'%India%\' AND `UD`.`userCity` LIKE \'%Indore%\' ORDER BY `UD`.`userFirstName` ASC', 0, 67, '2017-12-14 14:54:18'),
(4, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.727385), 2) + POW(69.1 * (75.883508- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `U`.`masterUserId` NOT IN (67)  AND `UD`.`isPreferencesAdded` = 1 HAVING distance <= 310.6855 ORDER BY `distance` ASC', 0, 67, '2017-12-14 14:55:25'),
(5, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `U`.`masterUserId` NOT IN (67)  AND `UD`.`isPreferencesAdded` = 1 HAVING distance <= 310.6855 ORDER BY `distance` ASC', 0, 67, '2017-12-14 14:57:07'),
(6, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 HAVING distance <= 310.6855 ORDER BY `distance` ASC', 1, 68, '2017-12-14 14:57:14'),
(7, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 HAVING distance <= 310.6855 ORDER BY `distance` ASC', 2, 68, '2017-12-14 14:57:35'),
(8, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 HAVING distance <= 310.6855 ORDER BY `distance` ASC', 2, 68, '2017-12-14 15:48:16'),
(9, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (67)  AND `UD`.`isPreferencesAdded` = 1 HAVING distance <= 310.6855 ORDER BY `distance` ASC', 1, 67, '2017-12-14 15:48:45'),
(10, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 HAVING distance <= 310.6855 ORDER BY `distance` ASC', 2, 68, '2017-12-14 15:49:28'),
(11, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 HAVING distance <= 310.6855 ORDER BY `distance` ASC', 2, 68, '2017-12-14 15:49:35'),
(12, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 AND ( `UD`.`userFirstName` LIKE \'%sorav%\' OR `UD`.`userLastName` LIKE \'%sorav%\' ) HAVING distance <= 310.6855 ORDER BY `distance` ASC', 1, 68, '2017-12-14 15:50:06'),
(13, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 HAVING distance <= 310.6855 ORDER BY `distance` ASC', 2, 68, '2017-12-14 15:50:39'),
(14, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 AND ( `UD`.`userFirstName` LIKE \'%ddsdsds%\' OR `UD`.`userLastName` LIKE \'%ddsdsds%\' ) HAVING distance <= 310.6855 ORDER BY `distance` ASC', 1, 68, '2017-12-14 15:51:11'),
(15, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 AND ( `UD`.`userFirstName` LIKE \'%garg%\' OR `UD`.`userLastName` LIKE \'%garg%\' ) HAVING distance <= 310.6855 ORDER BY `distance` ASC', 2, 68, '2017-12-14 15:51:16'),
(16, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' ) HAVING distance <= 310.6855 ORDER BY `distance` ASC', 2, 68, '2017-12-14 15:51:22'),
(17, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' ) HAVING distance <= 310.6855 ORDER BY `distance` ASC', 2, 68, '2017-12-14 15:52:00'),
(18, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) HAVING distance <= 310.6855 ORDER BY `distance` ASC', 0, 68, '2017-12-14 15:52:15'),
(19, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 HAVING distance <= 310.6855 ORDER BY `distance` ASC', 0, 68, '2017-12-14 15:52:36'),
(20, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 ORDER BY `UD`.`userFirstName` ASC', 0, 68, '2017-12-14 15:53:00'),
(21, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 ORDER BY `UD`.`userFirstName` ASC', 0, 68, '2017-12-14 15:53:12'),
(22, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 ORDER BY `UD`.`userFirstName` ASC', 0, 68, '2017-12-14 15:53:22'),
(23, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) HAVING distance <= 310.6855 ORDER BY `distance` ASC', 0, 68, '2017-12-14 15:53:55'),
(24, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' ) HAVING distance <= 310.6855 ORDER BY `distance` ASC', 2, 68, '2017-12-14 15:53:57'),
(25, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isPreferencesAdded` = 1 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' ) HAVING distance <= 310.6855 ORDER BY `distance` ASC', 2, 68, '2017-12-14 15:54:00'),
(26, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 ORDER BY `UD`.`userFirstName` ASC', 2, 68, '2017-12-14 15:55:13'),
(27, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) ORDER BY `UD`.`userFirstName` ASC', 1, 68, '2017-12-14 15:55:31'),
(28, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 ORDER BY `UD`.`userFirstName` ASC', 2, 68, '2017-12-14 15:55:44'),
(29, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 ORDER BY `UD`.`userFirstName` ASC', 2, 68, '2017-12-14 15:55:50'),
(30, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) ORDER BY `UD`.`userFirstName` ASC', 1, 68, '2017-12-14 15:56:00'),
(31, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GAfdfRG%\' OR `UD`.`userLastName` LIKE \'%GAfdfRG%\' OR `UD`.`userJobHeading` LIKE \'%GAfdfRG%\' OR `SK`.`skillName` LIKE \'%GAfdfRG%\' ) ORDER BY `UD`.`userFirstName` ASC', 0, 68, '2017-12-14 15:56:39'),
(32, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%DEV%\' OR `UD`.`userLastName` LIKE \'%DEV%\' OR `UD`.`userJobHeading` LIKE \'%DEV%\' OR `SK`.`skillName` LIKE \'%DEV%\' ) ORDER BY `UD`.`userFirstName` ASC', 1, 68, '2017-12-14 15:56:45'),
(33, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%WEB%\' OR `UD`.`userLastName` LIKE \'%WEB%\' OR `UD`.`userJobHeading` LIKE \'%WEB%\' OR `SK`.`skillName` LIKE \'%WEB%\' ) ORDER BY `UD`.`userFirstName` ASC', 1, 68, '2017-12-14 15:56:50'),
(34, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%MOBILE%\' OR `UD`.`userLastName` LIKE \'%MOBILE%\' OR `UD`.`userJobHeading` LIKE \'%MOBILE%\' OR `SK`.`skillName` LIKE \'%MOBILE%\' ) ORDER BY `UD`.`userFirstName` ASC', 0, 68, '2017-12-14 15:56:55'),
(35, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%MOBILE%\' OR `UD`.`userLastName` LIKE \'%MOBILE%\' OR `UD`.`userJobHeading` LIKE \'%MOBILE%\' OR `SK`.`skillName` LIKE \'%MOBILE%\' ) ORDER BY `UD`.`userFirstName` ASC', 1, 68, '2017-12-14 15:57:03'),
(36, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68)  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%DEV%\' OR `UD`.`userLastName` LIKE \'%DEV%\' OR `UD`.`userJobHeading` LIKE \'%DEV%\' OR `SK`.`skillName` LIKE \'%DEV%\' ) ORDER BY `UD`.`userFirstName` ASC', 2, 68, '2017-12-14 15:57:09'),
(37, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `describe_preferences` AS `DP` ON `U`.`masterUserId` = `DP`.`describePreferenceUserId`  INNER JOIN `looking_preferences` AS `LP` ON `U`.`masterUserId` = `LP`.`lookingPreferenceUserId`  INNER JOIN `preferences` AS `P` ON `P`.`preferenceID`= `DP`.`describePreferenceParentID` OR `P`.`preferenceID`= `LP`.`lookingPreferenceParentID` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68) AND `DP`.`describePreferenceParentID` IN (0,1,2,3) AND `DP`.`describePreferenceUserId` != 68 AND `LP`.`lookingPreferenceParentID` IN (0,4,5) AND `LP`.`lookingPreferenceUserId` != 68  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) HAVING distance <= 310.6855 ORDER BY `distance` ASC', 12, 68, '2017-12-25 13:54:27'),
(38, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `describe_preferences` AS `DP` ON `U`.`masterUserId` = `DP`.`describePreferenceUserId`  INNER JOIN `looking_preferences` AS `LP` ON `U`.`masterUserId` = `LP`.`lookingPreferenceUserId`  INNER JOIN `preferences` AS `P` ON `P`.`preferenceID`= `DP`.`describePreferenceParentID` OR `P`.`preferenceID`= `LP`.`lookingPreferenceParentID` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68) AND `DP`.`describePreferenceParentID` IN (0,1,2,3) AND `DP`.`describePreferenceUserId` != 68 AND `LP`.`lookingPreferenceParentID` IN (0,4,5) AND `LP`.`lookingPreferenceUserId` != 68  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) GROUP BY `U`.`masterUserId` HAVING distance <= 310.6855 ORDER BY `distance` ASC', 1, 68, '2017-12-25 13:58:14'),
(39, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `describe_preferences` AS `DP` ON `U`.`masterUserId` = `DP`.`describePreferenceUserId`  INNER JOIN `looking_preferences` AS `LP` ON `U`.`masterUserId` = `LP`.`lookingPreferenceUserId`  INNER JOIN `preferences` AS `P` ON `P`.`preferenceID`= `DP`.`describePreferenceParentID` OR `P`.`preferenceID`= `LP`.`lookingPreferenceParentID` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68) AND `DP`.`describePreferenceParentID` IN (0,1,2,3) AND `DP`.`describePreferenceUserId` != 68 AND `LP`.`lookingPreferenceParentID` IN (0,4,5) AND `LP`.`lookingPreferenceUserId` != 68  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) GROUP BY `U`.`masterUserId` HAVING distance <= 310.6855 ORDER BY `distance` ASC', 0, 68, '2017-12-25 14:01:20'),
(40, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `describe_preferences` AS `DP` ON `U`.`masterUserId` = `DP`.`describePreferenceUserId`  INNER JOIN `looking_preferences` AS `LP` ON `U`.`masterUserId` = `LP`.`lookingPreferenceUserId`  INNER JOIN `preferences` AS `P` ON `P`.`preferenceID`= `DP`.`describePreferenceParentID` OR `P`.`preferenceID`= `LP`.`lookingPreferenceParentID` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68) AND `DP`.`describePreferenceParentID` IN (0,1,2,3) AND `DP`.`describePreferenceUserId` != 68 OR `LP`.`lookingPreferenceParentID` IN (0,4,5) AND `LP`.`lookingPreferenceUserId` != 68  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) GROUP BY `U`.`masterUserId` HAVING distance <= 310.6855 ORDER BY `distance` ASC', 1, 68, '2017-12-25 14:02:00'),
(41, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `describe_preferences` AS `DP` ON `U`.`masterUserId` = `DP`.`describePreferenceUserId`  INNER JOIN `looking_preferences` AS `LP` ON `U`.`masterUserId` = `LP`.`lookingPreferenceUserId`  INNER JOIN `preferences` AS `P` ON `P`.`preferenceID`= `DP`.`describePreferenceParentID` OR `P`.`preferenceID`= `LP`.`lookingPreferenceParentID` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68) AND `DP`.`describePreferenceParentID` IN (0,1,2,3) AND `DP`.`describePreferenceUserId` != 68 OR `LP`.`lookingPreferenceParentID` IN (0,4,5) AND `LP`.`lookingPreferenceUserId` != 68  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) GROUP BY `U`.`masterUserId` HAVING distance <= 310.6855 ORDER BY `distance` ASC', 1, 68, '2017-12-25 14:03:11'),
(42, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `describe_preferences` AS `DP` ON `U`.`masterUserId` = `DP`.`describePreferenceUserId`  INNER JOIN `looking_preferences` AS `LP` ON `U`.`masterUserId` = `LP`.`lookingPreferenceUserId`  INNER JOIN `preferences` AS `P` ON `P`.`preferenceID`= `DP`.`describePreferenceParentID` OR `P`.`preferenceID`= `LP`.`lookingPreferenceParentID` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68) AND `DP`.`describePreferenceParentID` IN (0,1,2,3) AND `DP`.`describePreferenceUserId` != 68 OR `LP`.`lookingPreferenceParentID` IN (0,4,5) AND `LP`.`lookingPreferenceUserId` != 68  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) GROUP BY `U`.`masterUserId` HAVING distance <= 310.6855 ORDER BY `distance` ASC', 0, 68, '2017-12-25 14:03:19'),
(43, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `describe_preferences` AS `DP` ON `U`.`masterUserId` = `DP`.`describePreferenceUserId`  INNER JOIN `looking_preferences` AS `LP` ON `U`.`masterUserId` = `LP`.`lookingPreferenceUserId`  INNER JOIN `preferences` AS `P` ON `P`.`preferenceID`= `DP`.`describePreferenceParentID` OR `P`.`preferenceID`= `LP`.`lookingPreferenceParentID` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68) AND `DP`.`describePreferenceParentID` IN (0,1,2,3) AND `DP`.`describePreferenceUserId` != 68 OR `LP`.`lookingPreferenceParentID` IN (0,4,5) AND `LP`.`lookingPreferenceUserId` != 68  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) GROUP BY `U`.`masterUserId` HAVING distance <= 310.6855 ORDER BY `distance` ASC', 1, 68, '2017-12-25 14:03:25'),
(44, 'SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated , SQRT( POW(69.1 * (userLatitude - 22.36), 2) + POW(69.1 * (75.36- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `describe_preferences` AS `DP` ON `U`.`masterUserId` = `DP`.`describePreferenceUserId`  INNER JOIN `looking_preferences` AS `LP` ON `U`.`masterUserId` = `LP`.`lookingPreferenceUserId`  INNER JOIN `preferences` AS `P` ON `P`.`preferenceID`= `DP`.`describePreferenceParentID` OR `P`.`preferenceID`= `LP`.`lookingPreferenceParentID` INNER JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = \'NORMAL_USER\' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN (68) AND `DP`.`describePreferenceParentID` IN (0,1,2,3) AND ( `DP`.`describePreferenceUserId` != 68 OR `LP`.`lookingPreferenceParentID` IN (0,4,5)) AND `LP`.`lookingPreferenceUserId` != 68  AND `UD`.`isProviderPreferenceAdded` = 1  AND `UD`.`isBecomeProvider` = 1  AND `UD`.`isHideProfileAsProvider` = 0 AND ( `UD`.`userFirstName` LIKE \'%GARG%\' OR `UD`.`userLastName` LIKE \'%GARG%\' OR `UD`.`userJobHeading` LIKE \'%GARG%\' OR `SK`.`skillName` LIKE \'%GARG%\' ) GROUP BY `U`.`masterUserId` HAVING distance <= 310.6855 ORDER BY `distance` ASC', 1, 68, '2018-01-12 13:40:21');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `serviceID` bigint(20) NOT NULL,
  `serviceUserID` bigint(20) NOT NULL,
  `serviceName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `serviceDescprition` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `servicePrice` float NOT NULL,
  `serviceType` enum('FIXED','HOURLY') NOT NULL,
  `serviceOriginalImage` text,
  `serviceThumbnailImage` text COMMENT '(250 * 250)',
  `serviceAddedDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage provider services';

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`serviceID`, `serviceUserID`, `serviceName`, `serviceDescprition`, `servicePrice`, `serviceType`, `serviceOriginalImage`, `serviceThumbnailImage`, `serviceAddedDate`) VALUES
(2, 68, 'Software Developer', 'Hi', 20, 'HOURLY', 'uploads/services/service-1511243689981-3331e602-5deb-3647-7091-312be45d1801.png', 'uploads/services/service-1511243689981-3331e602-5deb-3647-7091-312be45d1801-thumb.png', '2017-11-21 05:50:44'),
(3, 68, 'Software`s Developer\'s', 'Hi', 15, 'FIXED', 'uploads/services/service-1513595250784-632bd6ca-0a81-3871-43ed-08222a393e81.png', 'uploads/services/service-1513595250784-632bd6ca-0a81-3871-43ed-08222a393e81-thumb.png', '2017-12-18 11:07:30');

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `skillID` bigint(20) NOT NULL,
  `skillName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `skillUserID` bigint(20) NOT NULL,
  `isMainSkill` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `skillAddedDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage provider skills';

--
-- Dumping data for table `skills`
--

INSERT INTO `skills` (`skillID`, `skillName`, `skillUserID`, `isMainSkill`, `skillAddedDate`) VALUES
(1, 'Web Development', 68, 1, '2017-12-20 13:29:38'),
(2, 'Mobile Dev', 69, 0, '2017-12-20 13:29:38'),
(3, 'Web Dev', 67, 0, '2017-12-20 13:29:38'),
(4, 'Angular.JS', 68, 0, '2018-01-16 09:24:49'),
(5, 'Angular.JS111', 68, 1, '2018-01-16 09:24:58');

-- --------------------------------------------------------

--
-- Table structure for table `skill_preferences`
--

CREATE TABLE `skill_preferences` (
  `skillPreferenceId` bigint(20) NOT NULL,
  `skillPreferenceUserId` bigint(20) NOT NULL,
  `skillPreferenceType` enum('FRIENDLY','DATING','PROVIDER') NOT NULL DEFAULT 'PROVIDER',
  `skillPreferenceText` varchar(250) NOT NULL,
  `skillPreferenceCreatedDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage provider skill preferences';

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `transactionID` bigint(20) NOT NULL,
  `transactionUserID` bigint(20) NOT NULL,
  `transactionFriendID` bigint(20) DEFAULT NULL,
  `transactionCustomID` varchar(150) NOT NULL,
  `transactionAmount` float DEFAULT NULL,
  `transactionDateTime` datetime NOT NULL,
  `transactionStatus` enum('COMPLETED','FAILED','OTHER') NOT NULL,
  `transactionModuleName` varchar(100) DEFAULT NULL,
  `transactionMessage` varchar(250) DEFAULT NULL,
  `transactionPaymentID` text,
  `transactionMode` enum('ADVANCE','FROZEN','ADVANCE_AND_FROZEN','INSTANT') NOT NULL DEFAULT 'INSTANT',
  `transactionDisputed` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `transactionDisputeStatus` enum('NONE','PENDING','ADMIN_REJECTED','ADMIN_COMPLETED','USER_COMPLETED') NOT NULL DEFAULT 'NONE',
  `transactionPaymentResponse` text,
  `transactionParams` text,
  `transactionPaymentDateTime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user transactions';

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`transactionID`, `transactionUserID`, `transactionFriendID`, `transactionCustomID`, `transactionAmount`, `transactionDateTime`, `transactionStatus`, `transactionModuleName`, `transactionMessage`, `transactionPaymentID`, `transactionMode`, `transactionDisputed`, `transactionDisputeStatus`, `transactionPaymentResponse`, `transactionParams`, `transactionPaymentDateTime`) VALUES
(16, 68, NULL, 'TXN-20171206104412', 50, '2017-12-06 10:44:12', 'FAILED', 'WALLET_ADD_MONEY', '$50 failed to add money into your wallet', NULL, 'INSTANT', 1, 'PENDING', '{"error":"Your card number is incorrect."}', NULL, '2017-12-06 10:44:12'),
(17, 68, NULL, 'TXN-20171206104433', 50, '2017-12-06 10:44:33', 'COMPLETED', 'WALLET_ADD_MONEY', '$50 successfully added into your wallet', NULL, 'INSTANT', 1, 'ADMIN_COMPLETED', '{"id":"ch_1BW0ODDgxxdmmt8GUkOMWLKM","object":"charge","amount":5000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BW0ODDgxxdmmt8GA5Hr0bXB","captured":true,"created":1512557073,"currency":"usd","customer":null,"description":"Add Money into Quick Love Wallet","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BW0ODDgxxdmmt8GUkOMWLKM/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BW0ODDgxxdmmt8GjwXBqiEc","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"yVdGGhX8xIDUncxw","funding":"unknown","last4":"1111","metadata":{},"name":"PKP","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}', NULL, '2017-12-06 10:44:33'),
(18, 67, 68, 'TXN-20171206112800', 249, '2017-12-06 11:28:00', 'COMPLETED', 'PURCHASE_PRODUCT', '$249 amount deducted while purchase a product', NULL, 'INSTANT', 0, 'NONE', '{"id":"ch_1BW14GDgxxdmmt8GfTHjbVi4","object":"charge","amount":24900,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BW14GDgxxdmmt8GSrPIWoBz","captured":true,"created":1512559680,"currency":"usd","customer":null,"description":"Sorav1 Garg has purchased a product","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BW14GDgxxdmmt8GfTHjbVi4/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BW14GDgxxdmmt8GsjAhk9mR","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"yVdGGhX8xIDUncxw","funding":"unknown","last4":"1111","metadata":{},"name":"SG","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}', '{"orderID":5}', '2017-12-06 11:28:00'),
(19, 68, NULL, 'TXN-20171206120336', 50, '2017-12-06 12:03:36', 'COMPLETED', 'WALLET_ADD_MONEY', '$50 successfully added into your wallet', NULL, 'INSTANT', 0, 'NONE', '{"id":"ch_1BW1chDgxxdmmt8GGmk5aqSi","object":"charge","amount":5000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BW1ciDgxxdmmt8Ghl6t3f4p","captured":true,"created":1512561815,"currency":"usd","customer":null,"description":"Add Money into Quick Love Wallet","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BW1chDgxxdmmt8GGmk5aqSi/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BW1chDgxxdmmt8GpPJMr948","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"yVdGGhX8xIDUncxw","funding":"unknown","last4":"1111","metadata":{},"name":"PKP","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}', NULL, '2017-12-06 12:03:36'),
(20, 67, 68, 'TXN-20171206120551', 250, '2017-12-06 12:05:51', 'COMPLETED', 'PURCHASE_PRODUCT', '$250 amount deducted while purchase a product', NULL, 'INSTANT', 0, 'NONE', '{"id":"ch_1BW1etDgxxdmmt8GkSJCy5c9","object":"charge","amount":25000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BW1etDgxxdmmt8G7VLWKlm0","captured":true,"created":1512561951,"currency":"usd","customer":null,"description":"Sorav1 Garg has purchased a product","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BW1etDgxxdmmt8GkSJCy5c9/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BW1etDgxxdmmt8G7RSXIisj","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"yVdGGhX8xIDUncxw","funding":"unknown","last4":"1111","metadata":{},"name":"SG","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}', NULL, '2017-12-06 12:05:51'),
(21, 68, NULL, 'TXN-20171207081528', 50, '2017-12-07 08:15:28', 'FAILED', 'WALLET_WITHDRAW_MONEY', '$50 failed to withdraw money from your wallet', NULL, 'INSTANT', 0, 'NONE', '{"error":"You have insufficient funds in your Stripe account. One likely reason you have insufficient funds is that your funds are automatically being paid out; try enabling manual payouts by going to https://dashboard.stripe.com/account/payouts."}', NULL, '2017-12-07 08:15:28'),
(22, 68, NULL, 'TXN-20171207081904', 50, '2017-12-07 08:19:04', 'FAILED', 'WALLET_WITHDRAW_MONEY', '$50 failed to withdraw money from your wallet', NULL, 'INSTANT', 0, 'NONE', '{"error":"You have insufficient funds in your Stripe account. One likely reason you have insufficient funds is that your funds are automatically being paid out; try enabling manual payouts by going to https://dashboard.stripe.com/account/payouts."}', NULL, '2017-12-07 08:19:04'),
(23, 68, NULL, 'TXN-20171207082629', 1, '2017-12-07 08:26:29', 'FAILED', 'WALLET_WITHDRAW_MONEY', '$1 failed to withdraw money from your wallet', NULL, 'INSTANT', 0, 'NONE', '{"error":"You have insufficient funds in your Stripe account. One likely reason you have insufficient funds is that your funds are automatically being paid out; try enabling manual payouts by going to https://dashboard.stripe.com/account/payouts."}', NULL, '2017-12-07 08:26:29'),
(24, 68, NULL, 'TXN-20171207090600', 150, '2017-12-07 09:06:00', 'COMPLETED', 'WALLET_ADD_MONEY', '$150 successfully added into your wallet', NULL, 'INSTANT', 0, 'NONE', '{"id":"ch_1BWLKNDgxxdmmt8GoyJ3Os6h","object":"charge","amount":15000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BWLKODgxxdmmt8GBjKaCzU5","captured":true,"created":1512637559,"currency":"usd","customer":null,"description":"Add Money into Quick Love Wallet","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BWLKNDgxxdmmt8GoyJ3Os6h/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BWLKNDgxxdmmt8GXdw4wPKH","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"KD0GXMXDsUQhKWEm","funding":"credit","last4":"0077","metadata":{},"name":"PKP","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}', NULL, '2017-12-07 09:06:00'),
(25, 68, NULL, 'TXN-20171207090655', 50, '2017-12-07 09:06:55', 'COMPLETED', 'WALLET_WITHDRAW_MONEY', '$50 successfully withdraw money from your wallet', NULL, 'INSTANT', 0, 'NONE', '{"id":"tr_1BWLLHDgxxdmmt8GVQQklroI","object":"transfer","amount":5000,"amount_reversed":0,"balance_transaction":"txn_1BWLLHDgxxdmmt8GRFdzDPHB","created":1512637615,"currency":"usd","description":null,"destination":"acct_182G4mA6D6xB5c5v","destination_payment":"py_1BWLLHA6D6xB5c5vQPO3vYTr","livemode":false,"metadata":{},"reversals":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers/tr_1BWLLHDgxxdmmt8GVQQklroI/reversals"},"reversed":false,"source_transaction":null,"source_type":"card","transfer_group":"USER-68-1512637610812"}', NULL, '2017-12-07 09:06:55'),
(26, 68, NULL, 'TXN-20171207091144', 50, '2017-12-07 09:11:44', 'COMPLETED', 'WALLET_WITHDRAW_MONEY', '$50 successfully withdraw money from your wallet', NULL, 'INSTANT', 0, 'NONE', '{"id":"tr_1BWLPwDgxxdmmt8GmvgVZlsx","object":"transfer","amount":5000,"amount_reversed":0,"balance_transaction":"txn_1BWLPwDgxxdmmt8GsM6K2NIb","created":1512637904,"currency":"usd","description":null,"destination":"acct_182G4mA6D6xB5c5v","destination_payment":"py_1BWLPwA6D6xB5c5vIWz9BdJG","livemode":false,"metadata":{},"reversals":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers/tr_1BWLPwDgxxdmmt8GmvgVZlsx/reversals"},"reversed":false,"source_transaction":null,"source_type":"card","transfer_group":"USER-68-1512637898863"}', NULL, '2017-12-07 09:11:44'),
(27, 68, NULL, 'TXN-20171207091235', 500, '2017-12-07 09:12:35', 'FAILED', 'WALLET_WITHDRAW_MONEY', '$500 failed to withdraw money from your wallet', NULL, 'INSTANT', 0, 'NONE', '{"error":"You have insufficient funds in your Stripe account. One likely reason you have insufficient funds is that your funds are automatically being paid out; try enabling manual payouts by going to https://dashboard.stripe.com/account/payouts."}', NULL, '2017-12-07 09:12:35'),
(28, 68, NULL, 'TXN-20171207091245', 10, '2017-12-07 09:12:45', 'COMPLETED', 'WALLET_WITHDRAW_MONEY', '$10 successfully withdraw money from your wallet', NULL, 'INSTANT', 0, 'NONE', '{"id":"tr_1BWLQuDgxxdmmt8GidNqwHTi","object":"transfer","amount":1000,"amount_reversed":0,"balance_transaction":"txn_1BWLQuDgxxdmmt8GVRKygCBR","created":1512637964,"currency":"usd","description":null,"destination":"acct_182G4mA6D6xB5c5v","destination_payment":"py_1BWLQuA6D6xB5c5vMLhZc7ca","livemode":false,"metadata":{},"reversals":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers/tr_1BWLQuDgxxdmmt8GidNqwHTi/reversals"},"reversed":false,"source_transaction":null,"source_type":"card","transfer_group":"USER-68-1512637963006"}', NULL, '2017-12-07 09:12:45'),
(29, 68, NULL, 'TXN-20171207091425', 10, '2017-12-07 09:14:25', 'COMPLETED', 'WALLET_WITHDRAW_MONEY', '$10 successfully withdraw money from your wallet', NULL, 'INSTANT', 0, 'NONE', '{"id":"tr_1BWLSXDgxxdmmt8GFji88kLN","object":"transfer","amount":1000,"amount_reversed":0,"balance_transaction":"txn_1BWLSXDgxxdmmt8Gd2DmO1dQ","created":1512638065,"currency":"usd","description":null,"destination":"acct_182G4mA6D6xB5c5v","destination_payment":"py_1BWLSXA6D6xB5c5vlDuiCGCO","livemode":false,"metadata":{},"reversals":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers/tr_1BWLSXDgxxdmmt8GFji88kLN/reversals"},"reversed":false,"source_transaction":null,"source_type":"card","transfer_group":"USER-68-1512638061342"}', NULL, '2017-12-07 09:14:25'),
(30, 68, NULL, 'TXN-20171207091440', 10, '2017-12-07 09:14:40', 'COMPLETED', 'WALLET_WITHDRAW_MONEY', '$10 withdraw money successfully from your wallet', NULL, 'INSTANT', 0, 'NONE', '{"id":"tr_1BWLSlDgxxdmmt8G5fegRm3g","object":"transfer","amount":1000,"amount_reversed":0,"balance_transaction":"txn_1BWLSlDgxxdmmt8GyQzudSsk","created":1512638079,"currency":"usd","description":null,"destination":"acct_182G4mA6D6xB5c5v","destination_payment":"py_1BWLSlA6D6xB5c5vXDqiuyqK","livemode":false,"metadata":{},"reversals":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers/tr_1BWLSlDgxxdmmt8G5fegRm3g/reversals"},"reversed":false,"source_transaction":null,"source_type":"card","transfer_group":"USER-68-1512638072795"}', NULL, '2017-12-07 09:14:40'),
(32, 68, NULL, 'TXN-20171207150729', 15, '2017-12-07 15:07:29', 'COMPLETED', 'PURCHASE_MEMBERSHIP', '$15 amount deducted while purchase membership', NULL, 'INSTANT', 0, 'NONE', '{"id":"ch_1BWQyCDgxxdmmt8GXaEniAXP","object":"charge","amount":1500,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BWQyCDgxxdmmt8GGR1DASR4","captured":true,"created":1512659248,"currency":"usd","customer":null,"description":"Pintu Patil 68 has purchased membership","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BWQyCDgxxdmmt8GXaEniAXP/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BWQyCDgxxdmmt8GkYrae2Wn","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"KD0GXMXDsUQhKWEm","funding":"credit","last4":"0077","metadata":{},"name":"SG","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}', NULL, '2017-12-07 15:07:29'),
(33, 68, NULL, 'TXN-20171207151112', 15, '2017-12-07 15:11:12', 'COMPLETED', 'PURCHASE_MEMBERSHIP', '$15 amount deducted while purchase membership', NULL, 'INSTANT', 0, 'NONE', '{"id":"ch_1BWR1nDgxxdmmt8GMa7BfJNq","object":"charge","amount":1500,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BWR1nDgxxdmmt8G3KYvQSsr","captured":true,"created":1512659471,"currency":"usd","customer":null,"description":"Pintu Patil 68 has purchased membership","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BWR1nDgxxdmmt8GMa7BfJNq/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BWR1nDgxxdmmt8GESJArDjT","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"KD0GXMXDsUQhKWEm","funding":"credit","last4":"0077","metadata":{},"name":"SG","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}', NULL, '2017-12-07 15:11:12'),
(34, 68, NULL, 'TXN-20171207151920', 15, '2017-12-07 15:19:20', 'COMPLETED', 'PURCHASE_MEMBERSHIP', '$15 amount deducted while purchase membership', NULL, 'INSTANT', 0, 'NONE', '{"id":"ch_1BWR9gDgxxdmmt8GRyw4er48","object":"charge","amount":1500,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BWR9gDgxxdmmt8GeMYoD55n","captured":true,"created":1512659960,"currency":"usd","customer":null,"description":"Pintu Patil 68 has purchased membership","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BWR9gDgxxdmmt8GRyw4er48/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BWR9gDgxxdmmt8Gc8NlHKVJ","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"KD0GXMXDsUQhKWEm","funding":"credit","last4":"0077","metadata":{},"name":"SG","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}', NULL, '2017-12-07 15:19:20'),
(35, 67, NULL, 'TXN-20171212055233', 1500, '2017-12-12 05:52:33', 'COMPLETED', 'WALLET_ADD_MONEY', '$1500 successfully added into your wallet', NULL, 'INSTANT', 0, 'NONE', '{"id":"ch_1BY6guDgxxdmmt8GEiUvfQzD","object":"charge","amount":150000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BY6gvDgxxdmmt8GRB8SjOuc","captured":true,"created":1513057952,"currency":"usd","customer":null,"description":"Add Money into Quick Love Wallet","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BY6guDgxxdmmt8GEiUvfQzD/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BY6guDgxxdmmt8GcXlR45on","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"KD0GXMXDsUQhKWEm","funding":"credit","last4":"0077","metadata":{},"name":"PKP","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}', NULL, '2017-12-12 05:52:33'),
(36, 67, NULL, 'TXN-20171214105815', 1500, '2017-12-14 10:58:15', 'COMPLETED', 'WALLET_ADD_MONEY', '$1500 successfully added into your wallet', NULL, 'INSTANT', 0, 'NONE', '{"id":"ch_1BYuPqDgxxdmmt8G8j1hqyu6","object":"charge","amount":150000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BYuPqDgxxdmmt8GYJR4wjNX","captured":true,"created":1513249094,"currency":"usd","customer":null,"description":"Add Money into Quick Love Wallet","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BYuPqDgxxdmmt8G8j1hqyu6/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BYuPqDgxxdmmt8GzIkKD8IP","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"KD0GXMXDsUQhKWEm","funding":"credit","last4":"0077","metadata":{},"name":"PKP`s","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}', NULL, '2017-12-14 10:58:15'),
(37, 5, NULL, 'TXN-20171223070019', 50, '2017-12-23 07:00:19', 'FAILED', 'ADMIN_TXN_REFUND_AMOUNT', '$50 amount refunded to user account', NULL, 'INSTANT', 0, 'NONE', '{"txnID":17,"paymentResp":{"id":"re_1Bc6zWDgxxdmmt8GR20Id9h4","object":"refund","amount":5000,"balance_transaction":"txn_1Bc6zXDgxxdmmt8GgByCVuo8","charge":"ch_1BW0ODDgxxdmmt8GUkOMWLKM","created":1514012418,"currency":"usd","metadata":{},"reason":null,"receipt_number":null,"status":"succeeded"}}', NULL, '2017-12-23 07:00:19');

-- --------------------------------------------------------

--
-- Table structure for table `txn_disputes`
--

CREATE TABLE `txn_disputes` (
  `disputeID` bigint(20) NOT NULL,
  `disputeUserID` bigint(20) NOT NULL COMMENT '(Dispute Initiater)',
  `disputeTxnID` bigint(20) NOT NULL,
  `disputeReason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `disputeStatus` enum('PENDING','ADMIN_REJECTED','ADMIN_COMPLETED','USER_COMPLETED') NOT NULL DEFAULT 'PENDING',
  `disputeDateTime` datetime NOT NULL,
  `disputeResponseDateTime` datetime DEFAULT NULL,
  `disputeExtraParams` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage transaction disputes';

--
-- Dumping data for table `txn_disputes`
--

INSERT INTO `txn_disputes` (`disputeID`, `disputeUserID`, `disputeTxnID`, `disputeReason`, `disputeStatus`, `disputeDateTime`, `disputeResponseDateTime`, `disputeExtraParams`) VALUES
(6, 68, 16, 'Failed', 'PENDING', '2017-12-22 07:08:45', NULL, NULL),
(7, 68, 17, 'Failed', 'ADMIN_COMPLETED', '2017-12-22 07:08:50', '2017-12-23 07:00:19', '{"adminReason":"Thanks....."}');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `masterUserId` bigint(20) NOT NULL,
  `userEmail` varchar(250) NOT NULL,
  `userPassword` varchar(255) DEFAULT NULL,
  `userType` enum('NORMAL_USER','SUPER_ADMIN','BECOME_PROVIDER') NOT NULL DEFAULT 'NORMAL_USER'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='For user logins';

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`masterUserId`, `userEmail`, `userPassword`, `userType`) VALUES
(5, 'admin@quicklove.com', 'e10adc3949ba59abbe56e057f20f883e', 'SUPER_ADMIN'),
(67, 'pintu.kumar.patil@gmail.com', NULL, 'NORMAL_USER'),
(68, 'pintu.kumar.parertil@gmail.com', NULL, 'NORMAL_USER'),
(69, 'sorav.mobiwebtech123@gmail.com', '34d74d56595bb92d6731d28fcf6065b6', 'NORMAL_USER'),
(70, 'sorav@mobiwebtech.com', '34d74d56595bb92d6731d28fcf6065b6', 'NORMAL_USER'),
(71, 'john@gmail.com', '34d74d56595bb92d6731d28fcf6065b6', 'NORMAL_USER'),
(75, 'rahul@gmail.com', '34d74d56595bb92d6731d28fcf6065b6', 'NORMAL_USER');

-- --------------------------------------------------------

--
-- Table structure for table `users_device_history`
--

CREATE TABLE `users_device_history` (
  `userDeviceHistoryId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `userDeviceToken` text NOT NULL COMMENT 'Used to send push notfications',
  `userDeviceType` enum('ANDROID','IOS') NOT NULL,
  `userDeviceId` varchar(150) NOT NULL COMMENT 'Device Unique ID',
  `deviceAddedDate` datetime NOT NULL,
  `deviceModifiedDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user devices history';

--
-- Dumping data for table `users_device_history`
--

INSERT INTO `users_device_history` (`userDeviceHistoryId`, `userId`, `userDeviceToken`, `userDeviceType`, `userDeviceId`, `deviceAddedDate`, `deviceModifiedDate`) VALUES
(1, 68, 'eucFsj0PQxY:APA91bHqMYqcaU4wyGnTSd-RiTySOPuLt6FM8L9nZ4rqLZtU2LtDTvf5eZuwPHj7gtZw1x420OGYqd0pxciJkCTCWdKmiY3u8PT_shkjk2NLOLKOQnIWoIi4DWFKT75qfIcJXxWlQGKZ', 'ANDROID', '5232ad9b5f593252', '2017-09-28 07:06:45', '2017-10-05 13:22:05'),
(2, 69, '123-456-789', 'IOS', '12346789', '2017-11-10 07:18:50', '2018-01-05 02:57:09');

-- --------------------------------------------------------

--
-- Table structure for table `user_calls_reciever`
--

CREATE TABLE `user_calls_reciever` (
  `userCallsRecieverId` bigint(20) NOT NULL,
  `userCallsRecieverUserId` bigint(20) NOT NULL COMMENT '(Call Initiate User Id)',
  `userCallsRecieverFriendId` bigint(20) NOT NULL COMMENT '(Call Reciver User Id)',
  `userCallsRecieverCallId` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user calls recevier users history';

-- --------------------------------------------------------

--
-- Table structure for table `user_details`
--

CREATE TABLE `user_details` (
  `userDetailsId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `userFirstName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userLastName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userAddress` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `userCountry` varchar(100) DEFAULT NULL,
  `userDOB` date DEFAULT NULL,
  `userLatitude` varchar(150) DEFAULT NULL,
  `userLongitude` varchar(150) DEFAULT NULL,
  `userSexualOrientation` varchar(150) DEFAULT NULL,
  `userMood` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAge` int(10) UNSIGNED DEFAULT NULL,
  `userGender` enum('MALE','FEMALE','OTHER') DEFAULT NULL,
  `userCity` varchar(150) DEFAULT NULL,
  `userLoginSessionKey` varchar(255) DEFAULT NULL,
  `isSocialSignup` smallint(6) NOT NULL DEFAULT '0' COMMENT '0 = NO, 1 = YES',
  `userSocialType` enum('FACEBOOK','TWITTER','INSTAGRAM') DEFAULT NULL,
  `userSocialId` text,
  `userImage` text,
  `userImageThumbnail` text COMMENT '150*150',
  `userCoverImage` text,
  `userCoverImageThumbnail` text COMMENT '(400*200)',
  `isFacebookVerified` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `isTwitterVerified` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `isInstagramVerified` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `noOfVerifiedSocialAccounts` smallint(1) NOT NULL DEFAULT '0',
  `noOfRedFlags` smallint(6) NOT NULL DEFAULT '0',
  `isGroupChatEnable` smallint(1) NOT NULL DEFAULT '1' COMMENT '0 = No, 1 = Yes',
  `isOpenForAllCalls` smallint(1) NOT NULL DEFAULT '1' COMMENT '0 = No, 1 = Yes',
  `isOpenForScheduledCalls` smallint(1) NOT NULL DEFAULT '1' COMMENT '0 = No, 1 = Yes',
  `isHideProfileAsProvider` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `userMembershipStatus` smallint(2) NOT NULL DEFAULT '1' COMMENT '0 = Inactive, 1 = Active',
  `userProfileUpdateStatus` smallint(2) NOT NULL DEFAULT '0' COMMENT '0 = Not Updated, 1 = Updated',
  `userProfileImageStatus` smallint(2) NOT NULL DEFAULT '0' COMMENT '0 = Not Uploaded, 1 = Uploaded',
  `userCoverImageStatus` smallint(2) NOT NULL DEFAULT '0' COMMENT '0 = Not Uploaded, 1 = Uploaded',
  `userWholeProfileStatus` smallint(2) NOT NULL DEFAULT '0' COMMENT '0 = Incomplete, 1 = Completed (Including update profile, profile image, cover image)',
  `userMaxImageUploadStatus` smallint(2) NOT NULL DEFAULT '0' COMMENT '0 = 3 Images, 1 = 10 Images',
  `noOfAllowedImages` int(11) NOT NULL DEFAULT '10' COMMENT '( Default - 10)',
  `isDatingImagesCountAdded` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes (User can upload 5 more images after completing 5 dates)',
  `isJobsImagesCountAdded` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes (User can upload 5 more images after completing 5 jobs)',
  `userJobHeading` varchar(150) DEFAULT NULL,
  `userBadges` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `userWalletAmount` float NOT NULL DEFAULT '0',
  `userWalletHoldAmount` bigint(20) NOT NULL DEFAULT '0',
  `isPreferencesAdded` smallint(2) NOT NULL DEFAULT '0' COMMENT '0 = no, 1 = yes (FOR FRIENDS MODULES)',
  `isDatingPreferenceAdded` smallint(1) NOT NULL DEFAULT '0',
  `isProviderPreferenceAdded` smallint(1) NOT NULL DEFAULT '0',
  `userEmailVerified` smallint(6) NOT NULL DEFAULT '0' COMMENT '0 = no, 1 = yes',
  `userPaymentAccountID` varchar(150) DEFAULT NULL COMMENT '(Stripe Account ID)',
  `userPaymentCustomerID` varchar(150) DEFAULT NULL COMMENT '(Stripe Customer ID)',
  `userRating` float NOT NULL DEFAULT '0',
  `noOfReviews` int(11) NOT NULL DEFAULT '0',
  `isBecomeProvider` smallint(1) NOT NULL DEFAULT '0',
  `isUserBlocked` smallint(6) NOT NULL DEFAULT '0' COMMENT '0 = no, 1 = yes (By Admin)',
  `isUserDeactivated` smallint(6) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes (By User)',
  `userTempCode` varchar(50) DEFAULT NULL,
  `userTempCodeSentTime` datetime DEFAULT NULL,
  `isRedFlagBlock` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes',
  `onlineStatus` enum('ONLINE','OFFLINE','AWAY','NONE') NOT NULL DEFAULT 'ONLINE',
  `redFlagBlockDateTime` datetime DEFAULT NULL COMMENT '(By Admin)',
  `isPaidMembeship` smallint(1) NOT NULL DEFAULT '0' COMMENT '0 = No, 1 = Yes ($19 app membership one time only)',
  `paidMemebershipDate` datetime DEFAULT NULL,
  `userRegistrationDate` datetime NOT NULL,
  `userNextThreeMonthDateTime` datetime DEFAULT NULL,
  `userTimeZone` varchar(50) CHARACTER SET utf8 DEFAULT NULL,
  `userLastLogin` datetime DEFAULT NULL,
  `userLastIpAddress` varchar(150) DEFAULT NULL,
  `userLastActivityDateTime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user details';

--
-- Dumping data for table `user_details`
--

INSERT INTO `user_details` (`userDetailsId`, `userId`, `userFirstName`, `userLastName`, `userAddress`, `userCountry`, `userDOB`, `userLatitude`, `userLongitude`, `userSexualOrientation`, `userMood`, `userAge`, `userGender`, `userCity`, `userLoginSessionKey`, `isSocialSignup`, `userSocialType`, `userSocialId`, `userImage`, `userImageThumbnail`, `userCoverImage`, `userCoverImageThumbnail`, `isFacebookVerified`, `isTwitterVerified`, `isInstagramVerified`, `noOfVerifiedSocialAccounts`, `noOfRedFlags`, `isGroupChatEnable`, `isOpenForAllCalls`, `isOpenForScheduledCalls`, `isHideProfileAsProvider`, `userMembershipStatus`, `userProfileUpdateStatus`, `userProfileImageStatus`, `userCoverImageStatus`, `userWholeProfileStatus`, `userMaxImageUploadStatus`, `noOfAllowedImages`, `isDatingImagesCountAdded`, `isJobsImagesCountAdded`, `userJobHeading`, `userBadges`, `userWalletAmount`, `userWalletHoldAmount`, `isPreferencesAdded`, `isDatingPreferenceAdded`, `isProviderPreferenceAdded`, `userEmailVerified`, `userPaymentAccountID`, `userPaymentCustomerID`, `userRating`, `noOfReviews`, `isBecomeProvider`, `isUserBlocked`, `isUserDeactivated`, `userTempCode`, `userTempCodeSentTime`, `isRedFlagBlock`, `onlineStatus`, `redFlagBlockDateTime`, `isPaidMembeship`, `paidMemebershipDate`, `userRegistrationDate`, `userNextThreeMonthDateTime`, `userTimeZone`, `userLastLogin`, `userLastIpAddress`, `userLastActivityDateTime`) VALUES
(2, 67, 'Sorav1', 'Garg', 'Tilak Nagar', 'India', '2001-06-23', '22.36', '75.36', 'test', 'Super excited🤗', NULL, 'MALE', 'Indore', 'ac489d43-572f-f45f-b6bb-b9548fc78b2f67', 1, 'FACEBOOK', '1459223074143703', 'uploads/users/user-1513579835026-accda63d-0000-b774-6c9a-d287332b717e.jpg', 'uploads/users/user-1513579835026-accda63d-0000-b774-6c9a-d287332b717e-thumb.jpg', 'uploads/users/user-1507527832765-e85c6225-3e55-4c95-b7d1-528fa8e5b0c2.jpg', 'uploads/users/user-1507527832765-e85c6225-3e55-4c95-b7d1-528fa8e5b0c2-thumb.jpg', 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 30, 1, 0, NULL, 67, 2939.5, 45, 1, 1, 1, 1, NULL, 'cus_Btl2gmwkMitLFY', 1.47, 3, 1, 0, 0, '268055', '2017-09-22 10:43:30', 0, 'ONLINE', NULL, 1, NULL, '2017-09-22 10:43:30', NULL, 'America/Los_Angeles', '2017-09-28 07:06:45', '192.168.1.125', '2017-10-09 09:38:38'),
(3, 68, 'Pintu', 'Patil 68', NULL, NULL, '2001-09-20', NULL, NULL, NULL, NULL, NULL, 'MALE', NULL, '684a9ccad5-c318-c504-7470-9c42d69842f6', 1, 'FACEBOOK', '14592ffdd23074143703', NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 25, 1, 0, NULL, 18, 1960.02, 206, 1, 0, 1, 1, 'acct_182G4mA6D6xB5c5v', 'cus_Bto0KzrS8zFV0n', 3, 2, 1, 0, 0, NULL, NULL, 0, 'ONLINE', NULL, 1, '2017-12-07 15:19:21', '2017-08-22 10:43:30', NULL, 'America/Los_Angeles', NULL, '192.168.1.125', NULL),
(4, 69, 'ddsdsds', 'Garg', NULL, NULL, '1991-06-04', '21.36', '72.25', NULL, NULL, 26, 'MALE', NULL, '94c8f668-d860-51b1-e3c2-db897481f43269', 0, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0, 5, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 10, 0, 0, NULL, 2, 0, 0, 1, 0, 1, 1, NULL, NULL, 0, 0, 1, 0, 0, '207941', '2017-09-25 10:16:37', 0, 'ONLINE', NULL, 1, NULL, '2017-09-25 10:16:37', NULL, 'Asia/Kolkata', '2018-01-05 08:27:09', '192.168.1.125', NULL),
(5, 5, 'Quick', 'Love', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'MALE', NULL, '5a5548650-eaf9-5b4c-227d-e77087e8fb60', 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 10, 0, 0, NULL, 0, 0, 0, 1, 0, 0, 1, NULL, NULL, 0, 0, 0, 0, 0, NULL, NULL, 0, 'ONLINE', NULL, 1, NULL, '2017-10-01 12:30:30', NULL, 'America/Los_Angeles', '2017-12-25 06:10:27', '192.168.1.125', NULL),
(6, 70, 'ddsdsds', 'Garg', NULL, NULL, '1991-06-04', NULL, NULL, NULL, NULL, 26, 'MALE', NULL, '70307ff501-f081-33dd-8f0d-27b463404c36', 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 20, 1, 0, NULL, 54, 0, 0, 1, 0, 0, 1, NULL, NULL, 0, 0, 0, 0, 0, '639628', '2017-10-04 08:17:23', 0, 'ONLINE', NULL, 1, NULL, '2017-10-04 08:17:23', NULL, 'America/Los_Angeles', NULL, '192.168.1.125', NULL),
(7, 71, 'John`s', 'Berg', NULL, NULL, '1991-06-04', NULL, NULL, NULL, NULL, 26, 'MALE', NULL, '71ae9ca90b-b2d0-ee6d-fb21-b09adffdb6fe', 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 10, 0, 0, NULL, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, '599646', '2017-12-14 10:59:33', 0, 'OFFLINE', NULL, 1, NULL, '2017-12-14 10:59:33', NULL, NULL, NULL, '192.168.1.125', NULL),
(8, 75, 'Rahul', 'Sina\'s', NULL, NULL, '1991-06-04', NULL, NULL, NULL, NULL, 26, 'MALE', NULL, '75ca6e0ad0-17e5-8055-56d6-271e448b3543', 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 10, 0, 0, NULL, 7, 0, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, 0, 0, '499050', '2017-12-18 11:04:09', 0, 'OFFLINE', NULL, 1, NULL, '2017-12-18 11:04:09', NULL, NULL, NULL, '192.168.1.125', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_gallery_images`
--

CREATE TABLE `user_gallery_images` (
  `userGalleryImageId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `userOriginalImage` text NOT NULL,
  `userThumbnailImage` text NOT NULL COMMENT '(250 * 250)',
  `userGalleryImageCreatedDate` datetime NOT NULL,
  `userGalleryImageModifiedDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user gallery images';

--
-- Dumping data for table `user_gallery_images`
--

INSERT INTO `user_gallery_images` (`userGalleryImageId`, `userId`, `userOriginalImage`, `userThumbnailImage`, `userGalleryImageCreatedDate`, `userGalleryImageModifiedDate`) VALUES
(3, 69, 'uploads/gallery/user-1506751377636-5b937862-d9b9-3f76-50e0-e5c3eda842db.png', 'uploads/gallery/user-1506751377636-5b937862-d9b9-3f76-50e0-e5c3eda842db-thumb.png', '2017-09-30 06:02:57', '2017-09-30 00:32:57'),
(4, 67, 'uploads/gallery/user-1507111600741-186cbec6-091f-8495-1879-821afdb96571.png', 'uploads/gallery/user-1507111600741-186cbec6-091f-8495-1879-821afdb96571-thumb.png', '2017-10-04 10:06:41', '2017-10-09 09:32:11');

-- --------------------------------------------------------

--
-- Table structure for table `user_inbox`
--

CREATE TABLE `user_inbox` (
  `userInboxId` bigint(20) NOT NULL,
  `userInboxSenderId` bigint(20) NOT NULL,
  `userInboxRecieverId` bigint(20) NOT NULL,
  `userInboxType` varchar(150) DEFAULT NULL,
  `userInboxMessage` text NOT NULL,
  `userInboxSentTime` datetime NOT NULL,
  `userInboxExtraParams` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user inbox messages';

-- --------------------------------------------------------

--
-- Table structure for table `user_social_verifications`
--

CREATE TABLE `user_social_verifications` (
  `userSocialVerificationID` bigint(20) NOT NULL,
  `userID` bigint(20) NOT NULL,
  `userSocialID` varchar(250) NOT NULL,
  `userSocialEmailId` varchar(250) NOT NULL,
  `userSocialType` enum('FACEBOOK','TWITTER','INSTAGRAM') NOT NULL,
  `IsVerified` smallint(2) NOT NULL DEFAULT '0',
  `verificationMode` enum('BY_SOCIAL_SIGNUP','BY_VERIFICATION') NOT NULL DEFAULT 'BY_SOCIAL_SIGNUP',
  `userSocialTempCode` int(11) DEFAULT NULL,
  `userSocialTempCodeSentTime` datetime DEFAULT NULL,
  `userVerificationDateTime` datetime NOT NULL COMMENT '(In UTC)'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user social verification accounts';

--
-- Dumping data for table `user_social_verifications`
--

INSERT INTO `user_social_verifications` (`userSocialVerificationID`, `userID`, `userSocialID`, `userSocialEmailId`, `userSocialType`, `IsVerified`, `verificationMode`, `userSocialTempCode`, `userSocialTempCodeSentTime`, `userVerificationDateTime`) VALUES
(2, 67, '1459223074143703', 'pintu.kumar.patil@gmail.com', 'FACEBOOK', 0, 'BY_SOCIAL_SIGNUP', NULL, NULL, '2017-09-22 10:43:30'),
(3, 68, '14592ffdd23074143703', 'pintu.kumar.parertil@gmail.com', 'FACEBOOK', 0, 'BY_SOCIAL_SIGNUP', NULL, NULL, '2017-09-22 10:43:30'),
(13, 69, '123-456-78dsds3232dsds9', 'sorav.mobiwebtech123@gmail.com', 'FACEBOOK', 1, 'BY_VERIFICATION', NULL, NULL, '2017-09-26 14:03:16'),
(14, 69, '123-456-78dsddsdsdsds3232dsds9', 'sorav.mobiwebtech123@gmail.com', 'TWITTER', 1, 'BY_VERIFICATION', NULL, NULL, '2017-09-28 13:13:21');

-- --------------------------------------------------------

--
-- Table structure for table `videos`
--

CREATE TABLE `videos` (
  `videoID` bigint(20) NOT NULL,
  `videoUserID` bigint(11) NOT NULL,
  `videoLength` int(11) DEFAULT NULL COMMENT '(In Seconds)',
  `videoSize` bigint(20) DEFAULT NULL COMMENT '(In Bytes)',
  `videoPath` text NOT NULL,
  `videoThumbnailPath` text,
  `videoAddedDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user videos';

--
-- Dumping data for table `videos`
--

INSERT INTO `videos` (`videoID`, `videoUserID`, `videoLength`, `videoSize`, `videoPath`, `videoThumbnailPath`, `videoAddedDate`) VALUES
(3, 68, 50, 1055736, 'uploads/videos/video-1511530858944-35104131-2146-9941-dd3d-32adf0cd07e5.mp4', 'uploads/videos/video-1511530858970-3412fb1d-59d2-056c-4fc5-0bc7d4f47053-thumbnail.png', '2017-11-24 13:40:59');

-- --------------------------------------------------------

--
-- Table structure for table `wallet`
--

CREATE TABLE `wallet` (
  `walletID` bigint(20) NOT NULL,
  `walletUserID` bigint(20) NOT NULL,
  `walletAmount` int(11) NOT NULL,
  `walletRemainingAmount` float DEFAULT NULL COMMENT '(After current trxn)',
  `walletTxnType` enum('ADDED','DEDUCT','NONE') NOT NULL DEFAULT 'NONE' COMMENT '(Money transfer from main account)',
  `walletTxnReason` varchar(150) DEFAULT NULL,
  `walletTxnID` varchar(150) DEFAULT NULL,
  `walletTxnStatus` enum('PENDING','FAILED','COMPLETED') NOT NULL DEFAULT 'PENDING',
  `walletTxnDateTime` datetime NOT NULL,
  `walletExtraParams` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='To manage user wallet';

--
-- Dumping data for table `wallet`
--

INSERT INTO `wallet` (`walletID`, `walletUserID`, `walletAmount`, `walletRemainingAmount`, `walletTxnType`, `walletTxnReason`, `walletTxnID`, `walletTxnStatus`, `walletTxnDateTime`, `walletExtraParams`) VALUES
(1, 68, 50, 1514.68, 'ADDED', 'ADD_MONEY', 'QL-20171206104433', 'COMPLETED', '2017-12-06 08:44:33', '{"id":"ch_1BW0ODDgxxdmmt8GUkOMWLKM","object":"charge","amount":5000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BW0ODDgxxdmmt8GA5Hr0bXB","captured":true,"created":1512557073,"currency":"usd","customer":null,"description":"Add Money into Quick Love Wallet","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BW0ODDgxxdmmt8GUkOMWLKM/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BW0ODDgxxdmmt8GjwXBqiEc","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"yVdGGhX8xIDUncxw","funding":"unknown","last4":"1111","metadata":{},"name":"PKP","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}'),
(12, 68, 15, 1437.68, 'DEDUCT', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20171206110123', 'COMPLETED', '2017-12-06 11:01:23', '{"jobID":18,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(13, 68, 15, 1437.68, 'NONE', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20171206110123', 'COMPLETED', '2017-12-06 11:01:23', '{"jobID":18,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"ADDED"}'),
(14, 68, 15, 1452.68, 'NONE', 'JOB_MODIFY_OLD_ADVANCE_AMOUNT', 'QL-20171206110213', 'COMPLETED', '2017-12-06 11:02:13', '{"jobID":18,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"DEDUCT"}'),
(15, 68, 15, 1452.68, 'ADDED', 'JOB_MODIFY_OLD_ADVANCE_AMOUNT', 'QL-20171206110213', 'COMPLETED', '2017-12-06 11:02:13', '{"jobID":18,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"ADDED"}'),
(16, 68, 10, 1442.68, 'NONE', 'JOB_MODIFY_CURRENT_ADVANCE_AMOUNT', 'QL-20171206110213', 'COMPLETED', '2017-12-06 11:02:13', '{"jobID":18,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"ADDED"}'),
(17, 68, 10, 1442.68, 'DEDUCT', 'JOB_MODIFY_CURRENT_ADVANCE_AMOUNT', 'QL-20171206110213', 'COMPLETED', '2017-12-06 11:02:13', '{"jobID":18,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(22, 68, 10, 1442.68, 'NONE', 'JOB_ACCEPT_HOLD_AMOUNT', 'QL-20171206110747', 'COMPLETED', '2017-12-06 11:07:47', '{"jobID":18,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"DEDUCT"}'),
(23, 68, 1, 1441.68, 'DEDUCT', 'JOB_ACCEPT_QL_FEES', 'QL-20171206110747', 'COMPLETED', '2017-12-06 11:07:47', '{"jobID":18,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(24, 67, 1, -1, 'DEDUCT', 'JOB_ACCEPT_QL_FEES', 'QL-20171206110747', 'COMPLETED', '2017-12-06 11:07:47', '{"jobID":18,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(25, 67, 5, 4, 'ADDED', 'JOB_RELEASE_MILESTONE_AMOUNT', 'QL-20171206111048', 'COMPLETED', '2017-12-06 11:10:48', '{"jobID":18,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"ADDED"}'),
(26, 67, 2, 2, 'DEDUCT', 'PURCHASE_PRODUCT', 'QL-20171206112800', 'COMPLETED', '2017-12-06 11:28:00', '{"orderID":5,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(27, 68, 50, 1722.6, 'ADDED', 'ADD_MONEY', 'QL-20171206120336', 'COMPLETED', '2017-12-06 12:03:36', '{"id":"ch_1BW1chDgxxdmmt8GGmk5aqSi","object":"charge","amount":5000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BW1ciDgxxdmmt8Ghl6t3f4p","captured":true,"created":1512561815,"currency":"usd","customer":null,"description":"Add Money into Quick Love Wallet","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BW1chDgxxdmmt8GGmk5aqSi/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BW1chDgxxdmmt8GpPJMr948","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"yVdGGhX8xIDUncxw","funding":"unknown","last4":"1111","metadata":{},"name":"PKP","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}'),
(28, 67, 1, 1, 'DEDUCT', 'PURCHASE_PRODUCT', 'QL-20171206120551', 'COMPLETED', '2017-12-06 12:05:51', '{"orderID":6,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(29, 68, 231, 1953.52, 'ADDED', 'PURCHASE_PRODUCT', 'QL-20171206120551', 'COMPLETED', '2017-12-06 12:05:51', '{"orderID":6,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"ADDED"}'),
(30, 68, 150, 2103.52, 'ADDED', 'ADD_MONEY', 'QL-20171207090600', 'COMPLETED', '2017-12-07 09:06:00', '{"id":"ch_1BWLKNDgxxdmmt8GoyJ3Os6h","object":"charge","amount":15000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BWLKODgxxdmmt8GBjKaCzU5","captured":true,"created":1512637559,"currency":"usd","customer":null,"description":"Add Money into Quick Love Wallet","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BWLKNDgxxdmmt8GoyJ3Os6h/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BWLKNDgxxdmmt8GXdw4wPKH","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"KD0GXMXDsUQhKWEm","funding":"credit","last4":"0077","metadata":{},"name":"PKP","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}'),
(31, 68, 50, 2053.52, 'DEDUCT', 'WALLET_WITHDRAW_MONEY', 'QL-20171207090655', 'COMPLETED', '2017-12-07 09:06:55', '{"id":"tr_1BWLLHDgxxdmmt8GVQQklroI","object":"transfer","amount":5000,"amount_reversed":0,"balance_transaction":"txn_1BWLLHDgxxdmmt8GRFdzDPHB","created":1512637615,"currency":"usd","description":null,"destination":"acct_182G4mA6D6xB5c5v","destination_payment":"py_1BWLLHA6D6xB5c5vQPO3vYTr","livemode":false,"metadata":{},"reversals":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers/tr_1BWLLHDgxxdmmt8GVQQklroI/reversals"},"reversed":false,"source_transaction":null,"source_type":"card","transfer_group":"USER-68-1512637610812"}'),
(32, 68, 50, 2003.52, 'DEDUCT', 'WALLET_WITHDRAW_MONEY', 'QL-20171207091144', 'COMPLETED', '2017-12-07 09:11:44', '{"id":"tr_1BWLPwDgxxdmmt8GmvgVZlsx","object":"transfer","amount":5000,"amount_reversed":0,"balance_transaction":"txn_1BWLPwDgxxdmmt8GsM6K2NIb","created":1512637904,"currency":"usd","description":null,"destination":"acct_182G4mA6D6xB5c5v","destination_payment":"py_1BWLPwA6D6xB5c5vIWz9BdJG","livemode":false,"metadata":{},"reversals":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers/tr_1BWLPwDgxxdmmt8GmvgVZlsx/reversals"},"reversed":false,"source_transaction":null,"source_type":"card","transfer_group":"USER-68-1512637898863"}'),
(33, 68, 10, 1993.52, 'DEDUCT', 'WALLET_WITHDRAW_MONEY', 'QL-20171207091245', 'COMPLETED', '2017-12-07 09:12:45', '{"id":"tr_1BWLQuDgxxdmmt8GidNqwHTi","object":"transfer","amount":1000,"amount_reversed":0,"balance_transaction":"txn_1BWLQuDgxxdmmt8GVRKygCBR","created":1512637964,"currency":"usd","description":null,"destination":"acct_182G4mA6D6xB5c5v","destination_payment":"py_1BWLQuA6D6xB5c5vMLhZc7ca","livemode":false,"metadata":{},"reversals":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers/tr_1BWLQuDgxxdmmt8GidNqwHTi/reversals"},"reversed":false,"source_transaction":null,"source_type":"card","transfer_group":"USER-68-1512637963006"}'),
(34, 68, 10, 1983.52, 'DEDUCT', 'WALLET_WITHDRAW_MONEY', 'QL-20171207091425', 'COMPLETED', '2017-12-07 09:14:25', '{"id":"tr_1BWLSXDgxxdmmt8GFji88kLN","object":"transfer","amount":1000,"amount_reversed":0,"balance_transaction":"txn_1BWLSXDgxxdmmt8Gd2DmO1dQ","created":1512638065,"currency":"usd","description":null,"destination":"acct_182G4mA6D6xB5c5v","destination_payment":"py_1BWLSXA6D6xB5c5vlDuiCGCO","livemode":false,"metadata":{},"reversals":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers/tr_1BWLSXDgxxdmmt8GFji88kLN/reversals"},"reversed":false,"source_transaction":null,"source_type":"card","transfer_group":"USER-68-1512638061342"}'),
(35, 68, 10, 1973.52, 'DEDUCT', 'WALLET_WITHDRAW_MONEY', 'QL-20171207091440', 'COMPLETED', '2017-12-07 09:14:40', '{"id":"tr_1BWLSlDgxxdmmt8G5fegRm3g","object":"transfer","amount":1000,"amount_reversed":0,"balance_transaction":"txn_1BWLSlDgxxdmmt8GyQzudSsk","created":1512638079,"currency":"usd","description":null,"destination":"acct_182G4mA6D6xB5c5v","destination_payment":"py_1BWLSlA6D6xB5c5vXDqiuyqK","livemode":false,"metadata":{},"reversals":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/transfers/tr_1BWLSlDgxxdmmt8G5fegRm3g/reversals"},"reversed":false,"source_transaction":null,"source_type":"card","transfer_group":"USER-68-1512638072795"}'),
(36, 68, 4, 1969.52, 'DEDUCT', 'PURCHASE_MEMBERSHIP', 'QL-20171207150729', 'COMPLETED', '2017-12-07 15:07:29', '{"userId":68,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(37, 68, 4, 1965.52, 'DEDUCT', 'PURCHASE_MEMBERSHIP', 'QL-20171207151112', 'COMPLETED', '2017-12-07 15:11:12', '{"userId":68,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(38, 68, 4, 1961.52, 'DEDUCT', 'PURCHASE_MEMBERSHIP', 'QL-20171207151921', 'COMPLETED', '2017-12-07 15:19:21', '{"userId":68,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(39, 67, 1500, 1501, 'ADDED', 'ADD_MONEY', 'QL-20171212055233', 'COMPLETED', '2017-12-12 05:52:33', '{"id":"ch_1BY6guDgxxdmmt8GEiUvfQzD","object":"charge","amount":150000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BY6gvDgxxdmmt8GRB8SjOuc","captured":true,"created":1513057952,"currency":"usd","customer":null,"description":"Add Money into Quick Love Wallet","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BY6guDgxxdmmt8GEiUvfQzD/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BY6guDgxxdmmt8GcXlR45on","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"KD0GXMXDsUQhKWEm","funding":"credit","last4":"0077","metadata":{},"name":"PKP","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}'),
(40, 67, 15, 1486, 'DEDUCT', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20171212055346', 'COMPLETED', '2017-12-12 05:53:46', '{"jobID":19,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(41, 67, 15, 1486, 'NONE', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20171212055346', 'COMPLETED', '2017-12-12 05:53:46', '{"jobID":19,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"ADDED"}'),
(42, 67, 15, 1471, 'DEDUCT', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20171212055451', 'COMPLETED', '2017-12-12 05:54:51', '{"jobID":20,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(43, 67, 15, 1471, 'NONE', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20171212055451', 'COMPLETED', '2017-12-12 05:54:51', '{"jobID":20,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"ADDED"}'),
(44, 67, 1500, 2971, 'ADDED', 'ADD_MONEY', 'QL-20171214105815', 'COMPLETED', '2017-12-14 10:58:15', '{"id":"ch_1BYuPqDgxxdmmt8G8j1hqyu6","object":"charge","amount":150000,"amount_refunded":0,"application":null,"application_fee":null,"balance_transaction":"txn_1BYuPqDgxxdmmt8GYJR4wjNX","captured":true,"created":1513249094,"currency":"usd","customer":null,"description":"Add Money into Quick Love Wallet","destination":null,"dispute":null,"failure_code":null,"failure_message":null,"fraud_details":{},"invoice":null,"livemode":false,"metadata":{},"on_behalf_of":null,"order":null,"outcome":{"network_status":"approved_by_network","reason":null,"risk_level":"normal","seller_message":"Payment complete.","type":"authorized"},"paid":true,"receipt_email":null,"receipt_number":null,"refunded":false,"refunds":{"object":"list","data":[],"has_more":false,"total_count":0,"url":"/v1/charges/ch_1BYuPqDgxxdmmt8G8j1hqyu6/refunds"},"review":null,"shipping":null,"source":{"id":"card_1BYuPqDgxxdmmt8GzIkKD8IP","object":"card","address_city":null,"address_country":null,"address_line1":null,"address_line1_check":null,"address_line2":null,"address_state":null,"address_zip":null,"address_zip_check":null,"brand":"Visa","country":"US","customer":null,"cvc_check":null,"dynamic_last4":null,"exp_month":8,"exp_year":2018,"fingerprint":"KD0GXMXDsUQhKWEm","funding":"credit","last4":"0077","metadata":{},"name":"PKP`s","tokenization_method":null},"source_transfer":null,"statement_descriptor":null,"status":"succeeded","transfer_group":null}'),
(45, 67, 15, 2956, 'DEDUCT', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20171218101443', 'COMPLETED', '2017-12-18 10:14:43', '{"jobID":21,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(46, 67, 15, 2956, 'NONE', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20171218101443', 'COMPLETED', '2017-12-18 10:14:43', '{"jobID":21,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"ADDED"}'),
(47, 67, 15, 2941, 'DEDUCT', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20180123043652', 'COMPLETED', '2018-01-23 04:36:52', '{"jobID":22,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(48, 67, 15, 2941, 'NONE', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20180123043652', 'COMPLETED', '2018-01-23 04:36:52', '{"jobID":22,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"ADDED"}'),
(49, 67, 15, 2941, 'DEDUCT', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20180123044218', 'COMPLETED', '2018-01-23 04:42:18', '{"jobID":23,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(50, 67, 15, 2941, 'NONE', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20180123044218', 'COMPLETED', '2018-01-23 04:42:18', '{"jobID":23,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"ADDED"}'),
(51, 67, 15, 2941, 'DEDUCT', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20180123044405', 'COMPLETED', '2018-01-23 04:44:05', '{"jobID":24,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(52, 67, 15, 2941, 'NONE', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20180123044405', 'COMPLETED', '2018-01-23 04:44:05', '{"jobID":24,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"ADDED"}'),
(53, 67, 15, 2941, 'DEDUCT', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20180123044504', 'COMPLETED', '2018-01-23 04:45:04', '{"jobID":25,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(54, 67, 15, 2941, 'NONE', 'JOB_POST_ADVCANCE_AMOUNT', 'QL-20180123044504', 'COMPLETED', '2018-01-23 04:45:04', '{"jobID":25,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"ADDED"}'),
(55, 67, 15, 2941, 'NONE', 'JOB_ACCEPT_HOLD_AMOUNT', 'QL-20180123044602', 'COMPLETED', '2018-01-23 04:46:02', '{"jobID":25,"walletTypeAccount":"HOLD_AC","walletAccountTxnType":"DEDUCT"}'),
(56, 67, 2, 2939.5, 'DEDUCT', 'JOB_ACCEPT_QL_FEES', 'QL-20180123044602', 'COMPLETED', '2018-01-23 04:46:02', '{"jobID":25,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}'),
(57, 68, 2, 1960.02, 'DEDUCT', 'JOB_ACCEPT_QL_FEES', 'QL-20180123044602', 'COMPLETED', '2018-01-23 04:46:02', '{"jobID":25,"walletTypeAccount":"MAIN_AC","walletAccountTxnType":"DEDUCT"}');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `allowed_images_history`
--
ALTER TABLE `allowed_images_history`
  ADD PRIMARY KEY (`allowedImageID`),
  ADD KEY `allowedImageUserID` (`allowedImageUserID`);

--
-- Indexes for table `block_users`
--
ALTER TABLE `block_users`
  ADD PRIMARY KEY (`userBlockId`),
  ADD KEY `userBlockUserId` (`userBlockUserId`),
  ADD KEY `userBlockFriendId` (`userBlockFriendId`);

--
-- Indexes for table `call_history`
--
ALTER TABLE `call_history`
  ADD PRIMARY KEY (`callHistoryID`),
  ADD KEY `callHistorySenderUserID` (`callSenderUserID`),
  ADD KEY `callHistoryRecieverUserID` (`callRecieverUserID`);

--
-- Indexes for table `call_history_users`
--
ALTER TABLE `call_history_users`
  ADD PRIMARY KEY (`callHistoryUsersID`),
  ADD KEY `callHistoryID` (`callHistoryID`),
  ADD KEY `callUserID` (`callUserID`);

--
-- Indexes for table `call_review`
--
ALTER TABLE `call_review`
  ADD PRIMARY KEY (`callReviewID`),
  ADD KEY `callReviewUserID` (`callReviewUserID`),
  ADD KEY `callReviewCallHistoryID` (`callReviewCallHistoryID`);

--
-- Indexes for table `contact_us`
--
ALTER TABLE `contact_us`
  ADD PRIMARY KEY (`contactId`),
  ADD KEY `contactUserId` (`contactUserId`);

--
-- Indexes for table `content`
--
ALTER TABLE `content`
  ADD PRIMARY KEY (`contentId`),
  ADD UNIQUE KEY `contentType` (`contentType`);

--
-- Indexes for table `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`countryId`);

--
-- Indexes for table `dating_review`
--
ALTER TABLE `dating_review`
  ADD PRIMARY KEY (`datingReviewID`),
  ADD KEY `datingReviewUserID` (`datingReviewUserID`),
  ADD KEY `datingReviewCallHistoryID` (`datingReviewDateScheduleID`),
  ADD KEY `datingReviewUserID_2` (`datingReviewUserID`),
  ADD KEY `datingReviewCallHistoryID_2` (`datingReviewDateScheduleID`);

--
-- Indexes for table `deal_breaker_preferences`
--
ALTER TABLE `deal_breaker_preferences`
  ADD PRIMARY KEY (`dealBreakerPreferenceId`),
  ADD KEY `dealBreakerPreferenceUserId` (`dealBreakerPreferenceUserId`);

--
-- Indexes for table `describe_preferences`
--
ALTER TABLE `describe_preferences`
  ADD PRIMARY KEY (`describePreferenceId`),
  ADD KEY `userPreferenceUserId` (`describePreferenceUserId`),
  ADD KEY `friendPreferenceParentID` (`describePreferenceParentID`);

--
-- Indexes for table `friends`
--
ALTER TABLE `friends`
  ADD PRIMARY KEY (`masterFriendId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `friendId` (`friendId`);

--
-- Indexes for table `hold_amounts`
--
ALTER TABLE `hold_amounts`
  ADD PRIMARY KEY (`holdAmountID`),
  ADD UNIQUE KEY `holdAmountJobID_2` (`holdAmountJobID`),
  ADD KEY `holdAmountUserID` (`holdAmountUserID`),
  ADD KEY `holdAmountJobID` (`holdAmountJobID`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`jobID`),
  ADD KEY `jobHirerUserID` (`jobHirerUserID`),
  ADD KEY `jobProviderUserID` (`jobProviderUserID`);

--
-- Indexes for table `jobs_payment_distribution`
--
ALTER TABLE `jobs_payment_distribution`
  ADD PRIMARY KEY (`jobPaymentDistributionID`),
  ADD UNIQUE KEY `jobParentID_3` (`jobParentID`),
  ADD KEY `jobParentID` (`jobParentID`),
  ADD KEY `jobParentID_2` (`jobParentID`);

--
-- Indexes for table `jobs_review`
--
ALTER TABLE `jobs_review`
  ADD PRIMARY KEY (`jobReviewID`),
  ADD KEY `jobReviewUserID` (`jobReviewUserID`),
  ADD KEY `jobReviewParentID` (`jobReviewParentID`);

--
-- Indexes for table `job_cancel`
--
ALTER TABLE `job_cancel`
  ADD PRIMARY KEY (`jobCancelID`),
  ADD KEY `jobCancelUserID` (`jobCancelUserID`),
  ADD KEY `jobParentID` (`jobParentID`);

--
-- Indexes for table `job_disputes`
--
ALTER TABLE `job_disputes`
  ADD PRIMARY KEY (`jobDisputeID`),
  ADD KEY `jobDisputeUserID` (`jobDisputeUserID`),
  ADD KEY `jobParentID` (`jobParentID`);

--
-- Indexes for table `looking_preferences`
--
ALTER TABLE `looking_preferences`
  ADD PRIMARY KEY (`lookingPreferenceId`),
  ADD KEY `userPreferenceUserId` (`lookingPreferenceUserId`),
  ADD KEY `looking_preferences_ibfk_2` (`lookingPreferenceParentID`);

--
-- Indexes for table `milestones`
--
ALTER TABLE `milestones`
  ADD PRIMARY KEY (`milestoneID`),
  ADD KEY `milestoneJobID` (`milestoneJobID`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notificationId`),
  ADD KEY `user_id` (`notificationUserId`),
  ADD KEY `sender_id` (`notificationFriendId`),
  ADD KEY `friendModuleId` (`friendModuleId`),
  ADD KEY `callScheduleModuleID` (`callScheduleModuleID`),
  ADD KEY `callHistoryModuleID` (`callHistoryModuleID`),
  ADD KEY `dateScheduleModuleID` (`dateScheduleModuleID`),
  ADD KEY `jobModuleID` (`jobModuleID`),
  ADD KEY `orderModuleID` (`orderModuleID`),
  ADD KEY `reportModuleID` (`reportModuleID`),
  ADD KEY `txnModuleID` (`txnModuleID`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`orderID`),
  ADD KEY `orderUserID` (`orderUserID`),
  ADD KEY `orderProductOwnerUserID` (`orderProductOwnerUserID`);

--
-- Indexes for table `order_products`
--
ALTER TABLE `order_products`
  ADD PRIMARY KEY (`orderProductID`),
  ADD KEY `orderProductUserID` (`orderProductUserID`),
  ADD KEY `orderParentID` (`orderParentID`);

--
-- Indexes for table `preferences`
--
ALTER TABLE `preferences`
  ADD PRIMARY KEY (`preferenceID`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`productID`),
  ADD KEY `productUserID` (`productUserID`);

--
-- Indexes for table `products_images`
--
ALTER TABLE `products_images`
  ADD PRIMARY KEY (`productImageID`),
  ADD KEY `productParentID` (`productParentID`);

--
-- Indexes for table `report_flag_categories`
--
ALTER TABLE `report_flag_categories`
  ADD PRIMARY KEY (`reportFlagCategoryID`),
  ADD UNIQUE KEY `reportFlagCategoryName` (`reportFlagCategoryName`);

--
-- Indexes for table `report_users`
--
ALTER TABLE `report_users`
  ADD PRIMARY KEY (`userReportId`),
  ADD KEY `userReportUserId` (`userReportUserId`),
  ADD KEY `userReportFriendId` (`userReportFriendId`);

--
-- Indexes for table `reschedule_calls`
--
ALTER TABLE `reschedule_calls`
  ADD PRIMARY KEY (`callReScheduleID`),
  ADD KEY `callScheduleID` (`callScheduleID`),
  ADD KEY `callReScheduleRequestUserID` (`callReScheduleRequestUserID`),
  ADD KEY `callScheduleID_2` (`callScheduleID`),
  ADD KEY `callReScheduleRequestUserID_2` (`callReScheduleRequestUserID`);

--
-- Indexes for table `reschedule_dating`
--
ALTER TABLE `reschedule_dating`
  ADD PRIMARY KEY (`datingReScheduleID`),
  ADD KEY `datingScheduleID` (`datingScheduleID`),
  ADD KEY `datingScheduleID_2` (`datingScheduleID`),
  ADD KEY `datingReScheduleRequestDateTime` (`datingReScheduleRequestDateTime`),
  ADD KEY `datingReScheduleRequestUserID` (`datingReScheduleRequestUserID`);

--
-- Indexes for table `schedule_calls`
--
ALTER TABLE `schedule_calls`
  ADD PRIMARY KEY (`callScheduleID`),
  ADD KEY `userCallIntitateUserId` (`callScheduleUserID`),
  ADD KEY `callScheduleOpponentUserID` (`callScheduleFriendID`),
  ADD KEY `callScheduleUserID` (`callScheduleUserID`),
  ADD KEY `callScheduleFriendID` (`callScheduleFriendID`);

--
-- Indexes for table `schedule_dating`
--
ALTER TABLE `schedule_dating`
  ADD PRIMARY KEY (`datingScheduleID`),
  ADD KEY `datingScheduleUserID` (`datingScheduleUserID`),
  ADD KEY `datingScheduleFriendID` (`datingScheduleFriendID`),
  ADD KEY `datingScheduleID` (`datingScheduleID`);

--
-- Indexes for table `search_logs`
--
ALTER TABLE `search_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`serviceID`),
  ADD KEY `serviceUserID` (`serviceUserID`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`skillID`),
  ADD KEY `skillUserID` (`skillUserID`);

--
-- Indexes for table `skill_preferences`
--
ALTER TABLE `skill_preferences`
  ADD PRIMARY KEY (`skillPreferenceId`),
  ADD KEY `skillPreferenceUserId` (`skillPreferenceUserId`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`transactionID`),
  ADD KEY `transactionUserID` (`transactionUserID`),
  ADD KEY `transactionFriendID` (`transactionFriendID`);

--
-- Indexes for table `txn_disputes`
--
ALTER TABLE `txn_disputes`
  ADD PRIMARY KEY (`disputeID`),
  ADD UNIQUE KEY `disputeTxnID_2` (`disputeTxnID`),
  ADD KEY `disputeUserID` (`disputeUserID`),
  ADD KEY `disputeTxnID` (`disputeTxnID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`masterUserId`),
  ADD UNIQUE KEY `email` (`userEmail`),
  ADD KEY `id` (`masterUserId`);

--
-- Indexes for table `users_device_history`
--
ALTER TABLE `users_device_history`
  ADD PRIMARY KEY (`userDeviceHistoryId`),
  ADD UNIQUE KEY `device_id` (`userDeviceId`),
  ADD KEY `user_id` (`userId`),
  ADD KEY `user_id_2` (`userId`),
  ADD KEY `user_id_3` (`userId`),
  ADD KEY `user_id_4` (`userId`),
  ADD KEY `user_id_5` (`userId`),
  ADD KEY `user_id_6` (`userId`);

--
-- Indexes for table `user_calls_reciever`
--
ALTER TABLE `user_calls_reciever`
  ADD PRIMARY KEY (`userCallsRecieverId`),
  ADD KEY `userCallsRecieverUserId` (`userCallsRecieverUserId`),
  ADD KEY `userCallsRecieverFriendId` (`userCallsRecieverFriendId`),
  ADD KEY `userCallsRecieverCallId` (`userCallsRecieverCallId`);

--
-- Indexes for table `user_details`
--
ALTER TABLE `user_details`
  ADD PRIMARY KEY (`userDetailsId`),
  ADD UNIQUE KEY `userId_2` (`userId`),
  ADD UNIQUE KEY `userLoginSessionKey` (`userLoginSessionKey`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `user_gallery_images`
--
ALTER TABLE `user_gallery_images`
  ADD PRIMARY KEY (`userGalleryImageId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `user_inbox`
--
ALTER TABLE `user_inbox`
  ADD PRIMARY KEY (`userInboxId`),
  ADD KEY `userInboxSenderId` (`userInboxSenderId`),
  ADD KEY `userInboxRecieverId` (`userInboxRecieverId`),
  ADD KEY `userInboxSenderId_2` (`userInboxSenderId`),
  ADD KEY `userInboxRecieverId_2` (`userInboxRecieverId`);

--
-- Indexes for table `user_social_verifications`
--
ALTER TABLE `user_social_verifications`
  ADD PRIMARY KEY (`userSocialVerificationID`),
  ADD UNIQUE KEY `userSocialID` (`userSocialID`),
  ADD KEY `userID` (`userID`);

--
-- Indexes for table `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`videoID`),
  ADD KEY `videoUserID` (`videoUserID`);

--
-- Indexes for table `wallet`
--
ALTER TABLE `wallet`
  ADD PRIMARY KEY (`walletID`),
  ADD KEY `walletUserID` (`walletUserID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `allowed_images_history`
--
ALTER TABLE `allowed_images_history`
  MODIFY `allowedImageID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT for table `block_users`
--
ALTER TABLE `block_users`
  MODIFY `userBlockId` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `call_history`
--
ALTER TABLE `call_history`
  MODIFY `callHistoryID` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `call_history_users`
--
ALTER TABLE `call_history_users`
  MODIFY `callHistoryUsersID` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `call_review`
--
ALTER TABLE `call_review`
  MODIFY `callReviewID` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `contact_us`
--
ALTER TABLE `contact_us`
  MODIFY `contactId` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `content`
--
ALTER TABLE `content`
  MODIFY `contentId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT for table `countries`
--
ALTER TABLE `countries`
  MODIFY `countryId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=247;
--
-- AUTO_INCREMENT for table `dating_review`
--
ALTER TABLE `dating_review`
  MODIFY `datingReviewID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT for table `deal_breaker_preferences`
--
ALTER TABLE `deal_breaker_preferences`
  MODIFY `dealBreakerPreferenceId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;
--
-- AUTO_INCREMENT for table `describe_preferences`
--
ALTER TABLE `describe_preferences`
  MODIFY `describePreferenceId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;
--
-- AUTO_INCREMENT for table `friends`
--
ALTER TABLE `friends`
  MODIFY `masterFriendId` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `hold_amounts`
--
ALTER TABLE `hold_amounts`
  MODIFY `holdAmountID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;
--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `jobID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;
--
-- AUTO_INCREMENT for table `jobs_payment_distribution`
--
ALTER TABLE `jobs_payment_distribution`
  MODIFY `jobPaymentDistributionID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;
--
-- AUTO_INCREMENT for table `jobs_review`
--
ALTER TABLE `jobs_review`
  MODIFY `jobReviewID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `job_cancel`
--
ALTER TABLE `job_cancel`
  MODIFY `jobCancelID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `job_disputes`
--
ALTER TABLE `job_disputes`
  MODIFY `jobDisputeID` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `looking_preferences`
--
ALTER TABLE `looking_preferences`
  MODIFY `lookingPreferenceId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT for table `milestones`
--
ALTER TABLE `milestones`
  MODIFY `milestoneID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;
--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notificationId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=166;
--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `orderID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `order_products`
--
ALTER TABLE `order_products`
  MODIFY `orderProductID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `preferences`
--
ALTER TABLE `preferences`
  MODIFY `preferenceID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `productID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;
--
-- AUTO_INCREMENT for table `products_images`
--
ALTER TABLE `products_images`
  MODIFY `productImageID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=291;
--
-- AUTO_INCREMENT for table `report_flag_categories`
--
ALTER TABLE `report_flag_categories`
  MODIFY `reportFlagCategoryID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `report_users`
--
ALTER TABLE `report_users`
  MODIFY `userReportId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `reschedule_calls`
--
ALTER TABLE `reschedule_calls`
  MODIFY `callReScheduleID` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `reschedule_dating`
--
ALTER TABLE `reschedule_dating`
  MODIFY `datingReScheduleID` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `schedule_calls`
--
ALTER TABLE `schedule_calls`
  MODIFY `callScheduleID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;
--
-- AUTO_INCREMENT for table `schedule_dating`
--
ALTER TABLE `schedule_dating`
  MODIFY `datingScheduleID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `search_logs`
--
ALTER TABLE `search_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;
--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `serviceID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `skillID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT for table `skill_preferences`
--
ALTER TABLE `skill_preferences`
  MODIFY `skillPreferenceId` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `transactionID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;
--
-- AUTO_INCREMENT for table `txn_disputes`
--
ALTER TABLE `txn_disputes`
  MODIFY `disputeID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `masterUserId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;
--
-- AUTO_INCREMENT for table `users_device_history`
--
ALTER TABLE `users_device_history`
  MODIFY `userDeviceHistoryId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `user_calls_reciever`
--
ALTER TABLE `user_calls_reciever`
  MODIFY `userCallsRecieverId` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `user_details`
--
ALTER TABLE `user_details`
  MODIFY `userDetailsId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
--
-- AUTO_INCREMENT for table `user_gallery_images`
--
ALTER TABLE `user_gallery_images`
  MODIFY `userGalleryImageId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT for table `user_inbox`
--
ALTER TABLE `user_inbox`
  MODIFY `userInboxId` bigint(20) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `user_social_verifications`
--
ALTER TABLE `user_social_verifications`
  MODIFY `userSocialVerificationID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
--
-- AUTO_INCREMENT for table `videos`
--
ALTER TABLE `videos`
  MODIFY `videoID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `wallet`
--
ALTER TABLE `wallet`
  MODIFY `walletID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `allowed_images_history`
--
ALTER TABLE `allowed_images_history`
  ADD CONSTRAINT `allowed_images_history_ibfk_1` FOREIGN KEY (`allowedImageUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `block_users`
--
ALTER TABLE `block_users`
  ADD CONSTRAINT `block_users_ibfk_1` FOREIGN KEY (`userBlockUserId`) REFERENCES `users` (`masterUserId`),
  ADD CONSTRAINT `block_users_ibfk_2` FOREIGN KEY (`userBlockFriendId`) REFERENCES `users` (`masterUserId`);

--
-- Constraints for table `call_history`
--
ALTER TABLE `call_history`
  ADD CONSTRAINT `call_history_ibfk_1` FOREIGN KEY (`callSenderUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `call_history_ibfk_2` FOREIGN KEY (`callRecieverUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `call_history_users`
--
ALTER TABLE `call_history_users`
  ADD CONSTRAINT `call_history_users_ibfk_1` FOREIGN KEY (`callHistoryID`) REFERENCES `call_history` (`callHistoryID`) ON DELETE CASCADE,
  ADD CONSTRAINT `call_history_users_ibfk_2` FOREIGN KEY (`callUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `call_review`
--
ALTER TABLE `call_review`
  ADD CONSTRAINT `call_review_ibfk_1` FOREIGN KEY (`callReviewUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `call_review_ibfk_2` FOREIGN KEY (`callReviewCallHistoryID`) REFERENCES `call_history` (`callHistoryID`) ON DELETE CASCADE;

--
-- Constraints for table `contact_us`
--
ALTER TABLE `contact_us`
  ADD CONSTRAINT `contact_us_ibfk_1` FOREIGN KEY (`contactUserId`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `dating_review`
--
ALTER TABLE `dating_review`
  ADD CONSTRAINT `dating_review_ibfk_1` FOREIGN KEY (`datingReviewUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `dating_review_ibfk_2` FOREIGN KEY (`datingReviewDateScheduleID`) REFERENCES `schedule_dating` (`datingScheduleID`) ON DELETE CASCADE;

--
-- Constraints for table `deal_breaker_preferences`
--
ALTER TABLE `deal_breaker_preferences`
  ADD CONSTRAINT `deal_breaker_preferences_ibfk_1` FOREIGN KEY (`dealBreakerPreferenceUserId`) REFERENCES `users` (`masterUserId`);

--
-- Constraints for table `describe_preferences`
--
ALTER TABLE `describe_preferences`
  ADD CONSTRAINT `describe_preferences_ibfk_1` FOREIGN KEY (`describePreferenceUserId`) REFERENCES `users` (`masterUserId`),
  ADD CONSTRAINT `describe_preferences_ibfk_2` FOREIGN KEY (`describePreferenceParentID`) REFERENCES `preferences` (`preferenceID`) ON DELETE CASCADE;

--
-- Constraints for table `friends`
--
ALTER TABLE `friends`
  ADD CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`masterUserId`),
  ADD CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`friendId`) REFERENCES `users` (`masterUserId`);

--
-- Constraints for table `hold_amounts`
--
ALTER TABLE `hold_amounts`
  ADD CONSTRAINT `hold_amounts_ibfk_1` FOREIGN KEY (`holdAmountUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `hold_amounts_ibfk_2` FOREIGN KEY (`holdAmountJobID`) REFERENCES `jobs` (`jobID`) ON DELETE CASCADE;

--
-- Constraints for table `jobs`
--
ALTER TABLE `jobs`
  ADD CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`jobHirerUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `jobs_ibfk_2` FOREIGN KEY (`jobProviderUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `jobs_payment_distribution`
--
ALTER TABLE `jobs_payment_distribution`
  ADD CONSTRAINT `jobs_payment_distribution_ibfk_1` FOREIGN KEY (`jobParentID`) REFERENCES `jobs` (`jobID`) ON DELETE CASCADE;

--
-- Constraints for table `jobs_review`
--
ALTER TABLE `jobs_review`
  ADD CONSTRAINT `jobs_review_ibfk_1` FOREIGN KEY (`jobReviewUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `jobs_review_ibfk_2` FOREIGN KEY (`jobReviewParentID`) REFERENCES `jobs` (`jobID`) ON DELETE CASCADE;

--
-- Constraints for table `job_cancel`
--
ALTER TABLE `job_cancel`
  ADD CONSTRAINT `job_cancel_ibfk_1` FOREIGN KEY (`jobCancelUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `job_cancel_ibfk_2` FOREIGN KEY (`jobParentID`) REFERENCES `jobs` (`jobID`) ON DELETE CASCADE;

--
-- Constraints for table `job_disputes`
--
ALTER TABLE `job_disputes`
  ADD CONSTRAINT `job_disputes_ibfk_1` FOREIGN KEY (`jobDisputeUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `job_disputes_ibfk_3` FOREIGN KEY (`jobParentID`) REFERENCES `jobs` (`jobID`) ON DELETE CASCADE;

--
-- Constraints for table `looking_preferences`
--
ALTER TABLE `looking_preferences`
  ADD CONSTRAINT `looking_preferences_ibfk_1` FOREIGN KEY (`lookingPreferenceUserId`) REFERENCES `users` (`masterUserId`),
  ADD CONSTRAINT `looking_preferences_ibfk_2` FOREIGN KEY (`lookingPreferenceParentID`) REFERENCES `preferences` (`preferenceID`) ON DELETE CASCADE;

--
-- Constraints for table `milestones`
--
ALTER TABLE `milestones`
  ADD CONSTRAINT `milestones_ibfk_1` FOREIGN KEY (`milestoneJobID`) REFERENCES `jobs` (`jobID`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`notificationUserId`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_10` FOREIGN KEY (`txnModuleID`) REFERENCES `transactions` (`transactionID`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`notificationFriendId`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`friendModuleId`) REFERENCES `friends` (`masterFriendId`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_4` FOREIGN KEY (`callScheduleModuleID`) REFERENCES `schedule_calls` (`callScheduleID`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_5` FOREIGN KEY (`callHistoryModuleID`) REFERENCES `call_history` (`callHistoryID`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_6` FOREIGN KEY (`dateScheduleModuleID`) REFERENCES `schedule_dating` (`datingScheduleID`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_7` FOREIGN KEY (`jobModuleID`) REFERENCES `jobs` (`jobID`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_8` FOREIGN KEY (`orderModuleID`) REFERENCES `orders` (`orderID`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_9` FOREIGN KEY (`reportModuleID`) REFERENCES `report_users` (`userReportId`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`orderUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`orderProductOwnerUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `order_products`
--
ALTER TABLE `order_products`
  ADD CONSTRAINT `order_products_ibfk_1` FOREIGN KEY (`orderProductUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_products_ibfk_2` FOREIGN KEY (`orderParentID`) REFERENCES `orders` (`orderID`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`productUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `products_images`
--
ALTER TABLE `products_images`
  ADD CONSTRAINT `products_images_ibfk_1` FOREIGN KEY (`productParentID`) REFERENCES `products` (`productID`) ON DELETE CASCADE;

--
-- Constraints for table `report_users`
--
ALTER TABLE `report_users`
  ADD CONSTRAINT `report_users_ibfk_1` FOREIGN KEY (`userReportUserId`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `report_users_ibfk_2` FOREIGN KEY (`userReportFriendId`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `reschedule_calls`
--
ALTER TABLE `reschedule_calls`
  ADD CONSTRAINT `reschedule_calls_ibfk_1` FOREIGN KEY (`callScheduleID`) REFERENCES `schedule_calls` (`callScheduleID`) ON DELETE CASCADE,
  ADD CONSTRAINT `reschedule_calls_ibfk_2` FOREIGN KEY (`callReScheduleRequestUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `reschedule_dating`
--
ALTER TABLE `reschedule_dating`
  ADD CONSTRAINT `reschedule_dating_ibfk_1` FOREIGN KEY (`datingScheduleID`) REFERENCES `schedule_dating` (`datingScheduleID`) ON DELETE CASCADE,
  ADD CONSTRAINT `reschedule_dating_ibfk_2` FOREIGN KEY (`datingReScheduleRequestUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `schedule_calls`
--
ALTER TABLE `schedule_calls`
  ADD CONSTRAINT `schedule_calls_ibfk_1` FOREIGN KEY (`callScheduleUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `schedule_calls_ibfk_2` FOREIGN KEY (`callScheduleFriendID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `schedule_dating`
--
ALTER TABLE `schedule_dating`
  ADD CONSTRAINT `schedule_dating_ibfk_1` FOREIGN KEY (`datingScheduleUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `schedule_dating_ibfk_2` FOREIGN KEY (`datingScheduleFriendID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`serviceUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `skills`
--
ALTER TABLE `skills`
  ADD CONSTRAINT `skills_ibfk_1` FOREIGN KEY (`skillUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `skill_preferences`
--
ALTER TABLE `skill_preferences`
  ADD CONSTRAINT `skill_preferences_ibfk_1` FOREIGN KEY (`skillPreferenceUserId`) REFERENCES `users` (`masterUserId`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`transactionUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`transactionFriendID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `txn_disputes`
--
ALTER TABLE `txn_disputes`
  ADD CONSTRAINT `txn_disputes_ibfk_1` FOREIGN KEY (`disputeUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `txn_disputes_ibfk_3` FOREIGN KEY (`disputeTxnID`) REFERENCES `transactions` (`transactionID`) ON DELETE CASCADE;

--
-- Constraints for table `users_device_history`
--
ALTER TABLE `users_device_history`
  ADD CONSTRAINT `fk_user_id` FOREIGN KEY (`userId`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `user_calls_reciever`
--
ALTER TABLE `user_calls_reciever`
  ADD CONSTRAINT `user_calls_reciever_ibfk_1` FOREIGN KEY (`userCallsRecieverUserId`) REFERENCES `users` (`masterUserId`),
  ADD CONSTRAINT `user_calls_reciever_ibfk_2` FOREIGN KEY (`userCallsRecieverFriendId`) REFERENCES `users` (`masterUserId`),
  ADD CONSTRAINT `user_calls_reciever_ibfk_3` FOREIGN KEY (`userCallsRecieverCallId`) REFERENCES `schedule_calls` (`callScheduleID`);

--
-- Constraints for table `user_details`
--
ALTER TABLE `user_details`
  ADD CONSTRAINT `user_details_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`masterUserId`);

--
-- Constraints for table `user_gallery_images`
--
ALTER TABLE `user_gallery_images`
  ADD CONSTRAINT `user_gallery_images_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `user_inbox`
--
ALTER TABLE `user_inbox`
  ADD CONSTRAINT `user_inbox_ibfk_1` FOREIGN KEY (`userInboxSenderId`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_inbox_ibfk_2` FOREIGN KEY (`userInboxRecieverId`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `user_social_verifications`
--
ALTER TABLE `user_social_verifications`
  ADD CONSTRAINT `user_social_verifications_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`masterUserId`);

--
-- Constraints for table `videos`
--
ALTER TABLE `videos`
  ADD CONSTRAINT `videos_ibfk_1` FOREIGN KEY (`videoUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

--
-- Constraints for table `wallet`
--
ALTER TABLE `wallet`
  ADD CONSTRAINT `wallet_ibfk_1` FOREIGN KEY (`walletUserID`) REFERENCES `users` (`masterUserId`) ON DELETE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
