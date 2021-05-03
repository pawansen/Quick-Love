<?php
include 'library.php'; // include the library file
include "classes/class.phpmailer.php"; // include the class name



if (isset($_REQUEST['contbtn']))  {
	//Email information
	$admin_email = "quickloveusa@gmail.com";
	$name = $_REQUEST['name'];
	$email = $_REQUEST['email'];
	$phone = $_REQUEST['phone'];
	$message = $_REQUEST['message'];

	$mail	= new PHPMailer; // call the class 
	$mail->IsSMTP(); 
	$mail->SMTPAuth = true; // authentication enabled
	$mail->SMTPSecure = 'tls'; // secure transfer enabled REQUIRED for GMail
	$mail->Host = "smtp.gmail.com"; //Hostname of the mail server
	$mail->Port = 587; //Port of the SMTP like to be 25, 80, 465 or 587
	$mail->SMTPAuth = true; //Whether to use SMTP authentication
	$mail->Username = "quickloveusa@gmail.com"; //Username for SMTP authentication any valid email created in your domain
	$mail->Password = 'QL4thewin!098'; //Password for SMTP authentication
	$mail->AddReplyTo("quickloveusa@gmail.com", "Quick Lover"); //reply-to address
	$mail->SetFrom("quickloveusa@gmail.com", "Website Contact"); //From address of the mail
	// put your while loop here like below,
	$mail->Subject = "Contact Form - Query"; //Subject od your mail
	$mail->AddAddress('quickloveusa@gmail.com'); //To address who will receive this email
	$mail->MsgHTML("
	<html>
	<body>
	<p style='font-size: 20px;font-weight: 700;'>User Details</p>
	<table style='border-collapse: collapse; width: 100%;'>
	<tr style='background-color: #dddddd;'>
	<th style='border: 1px solid #dddddd; text-align: left;padding: 8px;width: 15%;'>Name</th>
	<th style='border: 1px solid #dddddd; text-align: left;padding: 8px;width: 25%;'>Email</th>
	<th style='border: 1px solid #dddddd; text-align: left;padding: 8px;width: 15%;'>phone</th>
	<th style='border: 1px solid #dddddd; text-align: left;padding: 8px;width: 45%;'>message</th>
	</tr>
	<tr>
	<td style='border: 1px solid #dddddd; text-align: left;padding: 8px;'>".$name."</td>
	<td style='border: 1px solid #dddddd; text-align: left;padding: 8px;'>".$email."</td>
	<td style='border: 1px solid #dddddd; text-align: left;padding: 8px;'>".$phone."</td>
	<td style='border: 1px solid #dddddd; text-align: left;padding: 8px;'>".$message."</td>
	</tr>
	</table>
	</body>
	</html>
	"); //Put your body of the message you can place html code here
	//$mail->AddAttachment("images/asif18-logo.png"); //Attach a file here if any or comment this line, 
	$send = $mail->Send(); //Send the mails
	if($send){
		echo '<b style="color: #fff !important;padding: 12px 36px !important;font-weight: 600 !important;border: none !important;position: relative !important;display: inline-block !important;border-radius: 90px !important;margin: 10px 2px !important;background: #000 !important;background-size: 200% auto !important;">Mail Sent Successfully.</b><br><a href="/" style="color: #fff !important;padding: 12px 36px !important;font-weight: 600 !important;border: none !important;position: relative !important;display: inline-block !important;border-radius: 90px !important;margin: 10px 2px !important;background-image: linear-gradient(to right, #1d52e2 0%, #09b1ef 51%, #1e53e3 100%) !important;background-size: 200% auto !important;text-decoration:none !important;">Go Back to Homepage</a>';
	}
	else{
		echo '<b>Sorry Please Try Again.</b>';
	}
}
 if (isset($_REQUEST['subsbtn']))  {
                      
  //Email information
  $admin_email = "quickloveusa@gmail.com";
  $name = $_REQUEST['name'];
  $email = $_REQUEST['email'];

	$mail	= new PHPMailer; // call the class 
	$mail->IsSMTP(); 
	$mail->SMTPAuth = true; // authentication enabled
	$mail->SMTPSecure = 'tls'; // secure transfer enabled REQUIRED for GMail
	$mail->Host = "smtp.gmail.com"; //Hostname of the mail server
	$mail->Port = 587; //Port of the SMTP like to be 25, 80, 465 or 587
	$mail->SMTPAuth = true; //Whether to use SMTP authentication
	$mail->Username = "quickloveusa@gmail.com"; //Username for SMTP authentication any valid email created in your domain
	$mail->Password = 'QL4thewin!098'; //Password for SMTP authentication
	$mail->AddReplyTo("quickloveusa@gmail.com", "Quick Lover"); //reply-to address
	$mail->SetFrom("quickloveusa@gmail.com", "Website Contact"); //From address of the mail
	// put your while loop here like below,
	$mail->Subject = "Subscribe form - Query"; //Subject od your mail
	$mail->AddAddress('quickloveusa@gmail.com'); //To address who will receive this email
	$mail->MsgHTML("
                      <html>
                      <body>
                      <p style='font-size: 20px;font-weight: 700;'>User Details</p>
                      <table style='border-collapse: collapse; width: 100%;'>
                      <tr style='background-color: #dddddd;'>
                      <th style='border: 1px solid #dddddd; text-align: left;padding: 8px;'>Name</th>
                      <th style='border: 1px solid #dddddd; text-align: left;padding: 8px;'>Email</th>
                      </tr>
                      <tr>
                      <td style='border: 1px solid #dddddd; text-align: left;padding: 8px;'>".$name."</td>
                      <td style='border: 1px solid #dddddd; text-align: left;padding: 8px;'>".$email."</td>
                      </tr>
                      </table>
                      </body>
                      </html>
                      "); //Put your body of the message you can place html code here
	//$mail->AddAttachment("images/asif18-logo.png"); //Attach a file here if any or comment this line, 
	$send = $mail->Send(); //Send the mails
	if($send){
		echo '<b style="color: #fff !important;padding: 12px 36px !important;font-weight: 600 !important;border: none !important;position: relative !important;display: inline-block !important;border-radius: 90px !important;margin: 10px 2px !important;background: #000 !important;background-size: 200% auto !important;">Mail Sent Successfully.</b><br><a href="/" style="color: #fff !important;padding: 12px 36px !important;font-weight: 600 !important;border: none !important;position: relative !important;display: inline-block !important;border-radius: 90px !important;margin: 10px 2px !important;background-image: linear-gradient(to right, #1d52e2 0%, #09b1ef 51%, #1e53e3 100%) !important;background-size: 200% auto !important;text-decoration:none !important;">Go Back to Homepage</a>';
	}
	else{
		echo '<b>Sorry Please Try Again.</b>';
	}
}
?>