dScope = "";
barcodeService = "";
(function () {
	'use strict';

	angular
	.module('app.dashboard')
	.controller('dashboardController', DashboardController);

	DashboardController.$inject = ["$scope", "Auth", "$cordovaBarcodeScanner", "BarcodeService", "$q", "$timeout"]

	function DashboardController($scope, Auth, $cordovaBarcodeScanner, BarcodeService, $q, $timeout) {

		dScope = $scope;
		barcodeService = BarcodeService;

		$scope.showLoadingIndicator();
		$scope.barcodeItems = new Array();

		$scope.scanBarcode = function () {

			if (typeof cordova !== "undefined") {
				$cordovaBarcodeScanner
				.scan()
				.then(function (barcodeData) {

					// Success! Barcode data is here
					console.log("success", barcodeData);

					if (barcodeData) {
						if (barcodeData.cancelled != true && barcodeData.cancelled != "true") {
							barcodeData.timestamp = Date.now();
							$scope.saveBarcodeItem(barcodeData);
						} else {
							$scope.showToast($scope.getMessage("barcodeError"), $scope.getMessage("barcodeCancelled"));
						}
					} else {
						$scope.showToast($scope.getMessage("barcodeError"), $scope.getMessage("unknownError"));
					}

				}, function (error) {
					$scope.showToast($scope.getMessage("barcodeError"), $scope.getMessage("deviceNotSupported"));
					// An error occurred
				});
			}
		};

		$scope.saveBarcodeItem = function (barcodeData) {
			var BARCODE_CATEGORIES = $scope.BARCODE_CATEGORIES;
			var barcodeCategory = $scope.getBarcodeCategory(barcodeData);
			var barcodeItem = {
				category : barcodeCategory,
				barcodeData : barcodeData,
				_id : "" + Date.now()
			};

			$scope.copyToClipboard(barcodeData.text);
			
			switch (barcodeCategory) {

				case BARCODE_CATEGORIES.VCARD:
					barcodeItem.vCardFields = $scope.vCardParser(barcodeData.text);
					barcodeItem.title = barcodeItem.vCardFields.fn;
					break;

				case BARCODE_CATEGORIES.EMAIL:
					barcodeItem.emailFields = $scope.emailCardParser(barcodeData.text);
					barcodeItem.title = barcodeItem.emailFields.to;
					break;

				case BARCODE_CATEGORIES.SMS:
					barcodeItem.smsFields = $scope.smsCardParser(barcodeData.text);
					barcodeItem.title = barcodeItem.smsFields.to;
					break;

				case BARCODE_CATEGORIES.WEBLINK:
					barcodeItem.title = barcodeData.text;
					$scope.openExternalUrl(barcodeItem.title);
					break;

				case BARCODE_CATEGORIES.TEXT:
				default:
					barcodeItem.title = barcodeData.text;
					
			}

			return BarcodeService.addBarcode(barcodeItem);

		};

		$scope.moveItem = function (item, fromIndex, toIndex) {
			$scope.barcodeItems.splice(fromIndex, 1);
			$scope.barcodeItems.splice(toIndex, 0, item);
		};

		$scope.showBarcodeDetails = function (barcodeItem) {
			$scope.showNextPage("app.view.barcodeDetails", barcodeItem)
		};

		if (config.useLogin) {
			$scope.username = WL.Client.getUserName("UserIdentity");
		} else {
			$scope.username = "Anonymous";
		}

		$scope.goToDemoPage = function () {
			$scope.showNextPage('app.view.demo');
		};

		ionic.Platform.ready(function () {
			BarcodeService.initDB();

			BarcodeService.getAllBarcodes().then(function (barcodes) {
				// console.log("getAll : ", barcodes)
				if (barcodes.length == 0) {

					var q = $q.defer();
					var defs = new Array();

					defs.push($scope.saveBarcodeItem({
							"text" : "https://www.ufba.br",
							"format" : "QR_CODE",
							"cancelled" : false
						}));
					defs.push($scope.saveBarcodeItem({
							"text" : "Fabio Correia",
							"format" : "QR_CODE",
							"cancelled" : false
						}));
					defs.push($scope.saveBarcodeItem({
							"text" : "MATMSG:TO:yfabiocj@gmail.com;SUB:Subject Line;BODY:Message Lines;;",
							"format" : "QR_CODE",
							"cancelled" : false
						}));
					defs.push($scope.saveBarcodeItem({
							"text" : "SMSTO:557181940000:SMS Line",
							"format" : "QR_CODE",
							"cancelled" : false
						}));
					defs.push($scope.saveBarcodeItem({
							"text" : "BEGIN:VCARD\nVERSION:3.0\nN:Correia;Fabio\nFN:Fabio Correia\nORG:Streebo\nTITLE:Consultant\nADR:;;88/463;Salvador;Gujarat;382424;Brasil\nTEL;WORK;VOICE:\nTEL;CELL:557181940000\nTEL;FAX:\nEMAIL;WORK;INTERNET:fabiocj@gmail.com\nURL:\nBDAY:09/01/1985\nEND:VCARD\n",
							"format" : "QR_CODE",
							"cancelled" : false
						}));

					$q.all(defs).then(function () {
						BarcodeService.getAllBarcodes().then(function (barcodes) {
							$scope.barcodeItems = barcodes;
							$timeout(function () {

								$scope.$apply();
								$scope.hideLoadingIndicator();
							});
						});
					});

				} else {
					$scope.barcodeItems = barcodes;
					$scope.hideLoadingIndicator();
				}
			});
			// Get all barcode records from the database.


		});

		$scope.$on("barcodeChangeEvent", function () {
			console.log("barcodeChangeEvent Fired");
			$timeout(function () {
				$scope.$apply();
			});
		});
	}
})();
